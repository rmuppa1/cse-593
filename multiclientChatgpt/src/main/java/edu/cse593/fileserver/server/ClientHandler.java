package edu.cse593.fileserver.server;

import edu.cse593.fileserver.protocol.Protocol;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.EOFException;
import java.io.IOException;
import java.net.Socket;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.logging.Level;
import java.util.logging.Logger;

/** Owns one client connection from authentication through disconnect. */
final class ClientHandler implements Runnable {
    private final Socket socket;
    private final AuthService authService;
    private final FileService fileService;
    private final ServerState state;
    private final Logger logger;

    ClientHandler(Socket socket, AuthService authService, FileService fileService,
                  ServerState state, Logger logger) {
        this.socket = socket;
        this.authService = authService;
        this.fileService = fileService;
        this.state = state;
        this.logger = logger;
    }

    @Override
    public void run() {
        String remote = String.valueOf(socket.getRemoteSocketAddress());
        String userKey = null;
        state.connected();
        logger.info(() -> "Connected remote=" + remote + " activeClients=" + state.activeClientCount());
        try (socket;
             DataInputStream input = new DataInputStream(new BufferedInputStream(socket.getInputStream()));
             DataOutputStream output = new DataOutputStream(new BufferedOutputStream(socket.getOutputStream()))) {
            String username = authenticate(input, output, remote);
            if (username == null) return;
            userKey = remote + ":" + username;
            state.authenticated(userKey);
            commandLoop(username, input, output);
        } catch (EOFException ignored) {
            logger.info(() -> "Client closed connection remote=" + remote);
        } catch (IOException e) {
            logger.log(Level.WARNING, "Connection error remote=" + remote + " message=" + e.getMessage(), e);
        } finally {
            if (userKey != null) state.unauthenticated(userKey);
            state.disconnected();
            logger.info(() -> "Disconnected remote=" + remote + " activeClients=" + state.activeClientCount());
        }
    }

    private String authenticate(DataInputStream input, DataOutputStream output, String remote) throws IOException {
        for (int attempt = 1; attempt <= 3; attempt++) {
            String operation = input.readUTF();
            if (!Protocol.AUTH.equals(operation)) {
                sendError(output, "AUTH is required before commands");
                return null;
            }
            String username = input.readUTF();
            String password = input.readUTF();
            if (authService.authenticate(username, password)) {
                send(output, Protocol.OK, "Authenticated as " + username);
                logger.info("Authentication succeeded remote=" + remote + " user=" + username);
                return username;
            }
            int remaining = 3 - attempt;
            send(output, Protocol.ERROR, "Invalid credentials; attempts remaining: " + remaining);
            logger.warning("Authentication failed remote=" + remote + " user=" + username
                    + " attempt=" + attempt);
        }
        return null;
    }

    private void commandLoop(String username, DataInputStream input, DataOutputStream output) throws IOException {
        while (true) {
            String command = input.readUTF().toUpperCase(Locale.ROOT);
            logger.info("Command user=" + username + " command=" + command);
            try {
                switch (command) {
                    case Protocol.LIST -> list(output);
                    case Protocol.UPLOAD -> upload(input, output);
                    case Protocol.DOWNLOAD -> fileService.download(input.readUTF(), output);
                    case Protocol.DELETE -> delete(input.readUTF(), output);
                    case Protocol.INFO -> info(input.readUTF(), output);
                    case Protocol.TIME -> send(output, Protocol.OK, Instant.now().toString());
                    case Protocol.UPTIME -> send(output, Protocol.OK, state.uptime());
                    case Protocol.MEMORY -> memory(output);
                    case Protocol.CLIENTS -> clients(output);
                    case Protocol.THREADS -> threads(output);
                    case Protocol.EXIT -> {
                        send(output, Protocol.OK, "Goodbye");
                        return;
                    }
                    default -> sendError(output, "Unknown command: " + command);
                }
            } catch (IOException | RuntimeException e) {
                logger.log(Level.WARNING, "Command failed user=" + username + " command=" + command
                        + " message=" + e.getMessage(), e);
                sendError(output, e.getMessage() == null ? "Command failed" : e.getMessage());
            }
        }
    }

    private void list(DataOutputStream output) throws IOException {
        List<FileService.FileEntry> entries = fileService.list();
        send(output, Protocol.OK, entries.size() + " file(s)", false);
        output.writeInt(entries.size());
        for (FileService.FileEntry entry : entries) {
            output.writeUTF(entry.name());
            output.writeLong(entry.size());
            output.writeLong(entry.modifiedMillis());
        }
        output.flush();
    }

    private void upload(DataInputStream input, DataOutputStream output) throws IOException {
        String name = input.readUTF();
        long size = input.readLong();
        try {
            fileService.validateName(name);
            if (size < 0) throw new IOException("Invalid file size");
        } catch (IOException e) {
            sendError(output, e.getMessage());
            return;
        }
        send(output, Protocol.READY, "Send " + size + " bytes");
        fileService.upload(name, size, input);
        send(output, Protocol.OK, "Uploaded " + name + " (" + size + " bytes)");
    }

    private void delete(String name, DataOutputStream output) throws IOException {
        fileService.delete(name);
        send(output, Protocol.OK, "Deleted " + name);
    }

    private void info(String name, DataOutputStream output) throws IOException {
        FileService.FileInfo info = fileService.info(name);
        send(output, Protocol.OK, "File information", false);
        output.writeUTF(info.name());
        output.writeLong(info.size());
        output.writeLong(info.modifiedMillis());
        output.writeBoolean(info.readable());
        output.writeBoolean(info.writable());
        output.flush();
    }

    private void memory(DataOutputStream output) throws IOException {
        Runtime runtime = Runtime.getRuntime();
        send(output, Protocol.OK, "JVM memory", false);
        output.writeLong(runtime.totalMemory() - runtime.freeMemory());
        output.writeLong(runtime.freeMemory());
        output.writeLong(runtime.totalMemory());
        output.writeLong(runtime.maxMemory());
        output.flush();
    }

    private void clients(DataOutputStream output) throws IOException {
        send(output, Protocol.OK, "Client counts", false);
        output.writeInt(state.activeClientCount());
        output.writeInt(state.authenticatedClientCount());
        output.flush();
    }

    private void threads(DataOutputStream output) throws IOException {
        send(output, Protocol.OK, "JVM thread information", false);
        output.writeInt(Thread.activeCount());
        output.writeInt(java.lang.management.ManagementFactory.getThreadMXBean().getThreadCount());
        output.writeInt(java.lang.management.ManagementFactory.getThreadMXBean().getPeakThreadCount());
        output.flush();
    }

    private static void sendError(DataOutputStream output, String message) throws IOException {
        send(output, Protocol.ERROR, message);
    }

    private static void send(DataOutputStream output, String status, String message) throws IOException {
        send(output, status, message, true);
    }

    private static void send(DataOutputStream output, String status, String message, boolean flush) throws IOException {
        output.writeUTF(status);
        output.writeUTF(message);
        if (flush) output.flush();
    }
}
