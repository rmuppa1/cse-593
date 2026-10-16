package com.networks.server;

import com.networks.common.ProtocolConstants;
import com.networks.common.ResponseStatus;
import com.networks.server.auth.AuthService;
import com.networks.server.file.FileManager;
import com.networks.server.logging.ServerLogger;
import com.networks.server.system.SystemInfoService;

import java.io.*;
import java.net.Socket;

public class ClientHandler implements Runnable {
    private final Socket socket;
    private final ServerConfig config;
    private final AuthService auth;
    private final FileManager files;
    private final SystemInfoService sys;
    private final ServerLogger log;
    private final Runnable onClose;
    private final String addr;
    private String user;
    private int failedLogins;

    public ClientHandler(Socket socket, ServerConfig config, AuthService auth, FileManager files,
                         SystemInfoService sys, ServerLogger log, Runnable onClose) {
        this.socket = socket;
        this.config = config;
        this.auth = auth;
        this.files = files;
        this.sys = sys;
        this.log = log;
        this.onClose = onClose;
        this.addr = socket.getInetAddress().getHostAddress() + ":" + socket.getPort();
    }

    @Override
    public void run() {
        log.info("Client connected: " + addr);
        try (socket;
             DataInputStream in = new DataInputStream(new BufferedInputStream(socket.getInputStream()));
             DataOutputStream out = new DataOutputStream(new BufferedOutputStream(socket.getOutputStream()))) {
            socket.setSoTimeout(5 * 60 * 1000);
            while (true) {
                String line = in.readUTF();
                String[] parts = line.split(ProtocolConstants.DELIM, -1);
                String cmd = parts[0].toUpperCase();
                if (!cmd.equals(ProtocolConstants.LOGIN)) log.info(addr + " (" + user + ") command: " + cmd);
                if (cmd.equals(ProtocolConstants.EXIT)) {
                    reply(out, ResponseStatus.SUCCESS, "Goodbye");
                    break;
                }
                if (!dispatch(cmd, parts, in, out)) break;
            }
        } catch (EOFException e) {
            // client closed
        } catch (IOException e) {
            log.error(addr + " I/O error: " + e.getMessage());
        } catch (RuntimeException e) {
            log.error(addr + " unexpected error: " + e);
        } finally {
            log.info("Client disconnected: " + addr + (user != null ? " (" + user + ")" : ""));
            onClose.run();
        }
    }

    private void reply(DataOutputStream out, ResponseStatus s, String msg) throws IOException {
        out.writeUTF(s.name());
        out.writeUTF(msg);
        out.flush();
    }

    private void reply(DataOutputStream out, FileManager.Result r) throws IOException {
        reply(out, r.status(), r.message());
    }

    /** Returns false if the connection should be closed. */
    private boolean dispatch(String cmd, String[] p, DataInputStream in, DataOutputStream out) throws IOException {
        if (cmd.equals(ProtocolConstants.LOGIN)) return login(p, out);
        if (user == null) {
            log.warn(addr + " denied (unauthenticated): " + cmd);
            reply(out, ResponseStatus.UNAUTHORIZED, "Please login first");
            return true;
        }
        String arg = p.length > 1 ? p[1] : "";
        switch (cmd) {
            case ProtocolConstants.LIST -> reply(out, files.list());
            case ProtocolConstants.INFO -> reply(out, files.info(arg));
            case ProtocolConstants.DELETE -> {
                FileManager.Result r = files.delete(arg);
                log.info(addr + " DELETE " + arg + " -> " + r.status());
                reply(out, r);
            }
            case ProtocolConstants.DOWNLOAD -> download(arg, out);
            case ProtocolConstants.UPLOAD -> {
                long size;
                try { size = p.length > 2 ? Long.parseLong(p[2]) : -1; } catch (NumberFormatException e) { size = -1; }
                upload(arg, size, in, out);
            }
            case ProtocolConstants.TIME -> reply(out, ResponseStatus.SUCCESS, sys.time());
            case ProtocolConstants.UPTIME -> reply(out, ResponseStatus.SUCCESS, sys.uptime());
            case ProtocolConstants.MEMORY -> reply(out, ResponseStatus.SUCCESS, sys.memory());
            case ProtocolConstants.CLIENTS -> reply(out, ResponseStatus.SUCCESS, sys.clients());
            case ProtocolConstants.THREADS -> reply(out, ResponseStatus.SUCCESS, sys.threads());
            default -> reply(out, ResponseStatus.ERROR, "Unknown command: " + cmd);
        }
        return true;
    }

    private boolean login(String[] p, DataOutputStream out) throws IOException {
        if (user != null) {
            reply(out, ResponseStatus.SUCCESS, "Already logged in as " + user);
            return true;
        }
        String u = p.length > 1 ? p[1] : "";
        String pw = p.length > 2 ? p[2] : "";
        if (auth.authenticate(u, pw)) {
            user = u;
            failedLogins = 0;
            log.info(addr + " login success: " + u);
            reply(out, ResponseStatus.SUCCESS, "Welcome, " + u);
            return true;
        }
        failedLogins++;
        log.warn(addr + " login failed for '" + u + "' (" + failedLogins + "/" + config.getMaxLoginAttempts() + ")");
        if (failedLogins >= config.getMaxLoginAttempts()) {
            reply(out, ResponseStatus.UNAUTHORIZED, "Too many failed attempts. Disconnecting.");
            return false;
        }
        reply(out, ResponseStatus.UNAUTHORIZED, "Invalid credentials (" + (config.getMaxLoginAttempts() - failedLogins) + " attempts left)");
        return true;
    }

    private void download(String name, DataOutputStream out) throws IOException {
        FileManager.Begin b = files.beginDownload(name);
        if (b.failure() != null) {
            log.warn(addr + " DOWNLOAD " + name + " -> " + b.failure().status());
            reply(out, b.failure());
            return;
        }
        try (FileManager.Transfer t = b.transfer()) {
            reply(out, ResponseStatus.SUCCESS, "Sending " + name);
            long n = files.sendFile(t, out);
            log.info(addr + " DOWNLOAD " + name + " complete, " + n + " bytes");
        }
    }

    private void upload(String name, long size, DataInputStream in, DataOutputStream out) throws IOException {
        FileManager.Begin b = files.beginUpload(name, size);
        if (b.failure() != null) {
            log.warn(addr + " UPLOAD " + name + " -> " + b.failure().status());
            reply(out, b.failure());
            return;
        }
        try (FileManager.Transfer t = b.transfer()) {
            reply(out, ResponseStatus.SUCCESS, "Ready");
            files.receiveFile(t, in, size);
            log.info(addr + " UPLOAD " + name + " complete, " + size + " bytes");
            reply(out, ResponseStatus.SUCCESS, "Uploaded " + name + " (" + size + " bytes)");
        }
    }
}
