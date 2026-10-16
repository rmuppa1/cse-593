package com.networks.server;

import com.networks.common.ProtocolConstants;
import com.networks.common.ResponseStatus;
import com.networks.server.auth.AuthService;
import com.networks.server.file.FileManager;
import com.networks.server.logging.ServerLogger;
import com.networks.server.system.SystemInfoService;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.EOFException;
import java.io.IOException;
import java.net.Socket;

/** Serves one connected client: authentication, then command dispatch until EXIT or disconnect. */
public class ClientHandler implements Runnable {
    private final Socket socket;
    private final AuthService auth;
    private final FileManager files;
    private final SystemInfoService sys;
    private final ServerLogger log;
    private final int maxAttempts;
    private final String clientId;

    private String user;
    private int failedLogins;

    public ClientHandler(Socket socket, AuthService auth, FileManager files, SystemInfoService sys,
                         ServerLogger log, int maxAttempts) {
        this.socket = socket;
        this.auth = auth;
        this.files = files;
        this.sys = sys;
        this.log = log;
        this.maxAttempts = maxAttempts;
        this.clientId = socket.getInetAddress().getHostAddress() + ":" + socket.getPort();
    }

    @Override
    public void run() {
        ServerMain.clientConnected();
        log.info("Client connected: " + clientId);
        try (Socket s = socket;
             DataInputStream in = new DataInputStream(new BufferedInputStream(s.getInputStream()));
             DataOutputStream out = new DataOutputStream(new BufferedOutputStream(s.getOutputStream()))) {
            while (!s.isClosed()) {
                String line = ProtocolConstants.readText(in).trim();
                if (line.isEmpty()) continue;
                if (!handle(line, in, out)) break;
            }
        } catch (EOFException e) {
            log.info("Client " + clientId + " closed the connection");
        } catch (IOException e) {
            log.error("I/O error with " + clientId + ": " + e.getMessage());
        } catch (RuntimeException e) {
            log.error("Unexpected error with " + clientId + ": " + e);
        } finally {
            ServerMain.clientDisconnected();
            log.info("Client disconnected: " + clientId + (user != null ? " (user " + user + ")" : ""));
        }
    }

    /** Processes one command; returns false when the connection should close. */
    private boolean handle(String line, DataInputStream in, DataOutputStream out) throws IOException {
        String[] parts = line.split("\\s+", 2);
        String cmd = parts[0].toUpperCase();
        String arg = parts.length > 1 ? parts[1] : "";

        if (cmd.equals(ProtocolConstants.LOGIN)) {
            return login(arg, out);
        }
        if (cmd.equals(ProtocolConstants.EXIT)) {
            log.info("Command EXIT from " + clientId);
            reply(out, ResponseStatus.SUCCESS, "Goodbye");
            return false;
        }
        if (user == null) {
            log.warn("Access denied (not authenticated) from " + clientId + ": " + cmd);
            reply(out, ResponseStatus.UNAUTHORIZED, "Please log in first");
            return true;
        }
        log.info("Command from " + user + "@" + clientId + ": " + cmd + (arg.isEmpty() ? "" : " " + arg));

        switch (cmd) {
            case ProtocolConstants.LIST:
                send(out, files.list());
                break;
            case ProtocolConstants.INFO:
                send(out, files.info(arg));
                break;
            case ProtocolConstants.DELETE: {
                FileManager.Result r = files.delete(arg);
                if (r.status == ResponseStatus.SUCCESS) log.info("Deleted " + arg + " (" + r.bytes + " bytes)");
                send(out, r);
                break;
            }
            case ProtocolConstants.UPLOAD:
                upload(arg, in, out);
                break;
            case ProtocolConstants.DOWNLOAD: {
                FileManager.Result r = files.download(arg, out);
                logTransfer("Download", arg, r);
                break;
            }
            case ProtocolConstants.TIME:
                reply(out, ResponseStatus.SUCCESS, sys.time());
                break;
            case ProtocolConstants.UPTIME:
                reply(out, ResponseStatus.SUCCESS, sys.uptime());
                break;
            case ProtocolConstants.MEMORY:
                reply(out, ResponseStatus.SUCCESS, sys.memory());
                break;
            case ProtocolConstants.CLIENTS:
                reply(out, ResponseStatus.SUCCESS, sys.clients());
                break;
            case ProtocolConstants.THREADS:
                reply(out, ResponseStatus.SUCCESS, sys.threads());
                break;
            default:
                reply(out, ResponseStatus.ERROR, "Unknown command: " + cmd);
        }
        return true;
    }

    private boolean login(String arg, DataOutputStream out) throws IOException {
        if (user != null) {
            reply(out, ResponseStatus.ERROR, "Already logged in as " + user);
            return true;
        }
        String[] c = arg.split("\\s+", 2);
        if (c.length == 2 && auth.authenticate(c[0], c[1])) {
            user = c[0];
            failedLogins = 0;
            log.info("Login success: " + user + " from " + clientId);
            reply(out, ResponseStatus.SUCCESS, "Welcome, " + user);
            return true;
        }
        failedLogins++;
        log.warn("Login failed (" + failedLogins + "/" + maxAttempts + ") from " + clientId);
        if (failedLogins >= maxAttempts) {
            log.warn("Too many failed logins; disconnecting " + clientId);
            reply(out, ResponseStatus.UNAUTHORIZED, "Too many failed attempts. Disconnected.");
            return false;
        }
        reply(out, ResponseStatus.UNAUTHORIZED,
                "Invalid credentials (" + (maxAttempts - failedLogins) + " attempts left)");
        return true;
    }

    private void upload(String arg, DataInputStream in, DataOutputStream out) throws IOException {
        String[] p = arg.split("\\s+", 2);
        long size;
        try {
            size = Long.parseLong(p[0]);
        } catch (NumberFormatException e) {
            reply(out, ResponseStatus.ERROR, "Usage: UPLOAD <size> <filename>");
            return;
        }
        if (p.length < 2) {
            reply(out, ResponseStatus.ERROR, "Usage: UPLOAD <size> <filename>");
            return;
        }
        FileManager.Result r = files.upload(p[1], size, in, out);
        logTransfer("Upload", p[1], r);
    }

    private void logTransfer(String what, String name, FileManager.Result r) {
        if (r.status == ResponseStatus.SUCCESS) {
            log.info(what + " complete: " + name + " (" + r.bytes + " bytes) by " + user);
        } else {
            log.warn(what + " of " + name + " refused: " + r.status + " - " + r.message);
        }
    }

    private void send(DataOutputStream out, FileManager.Result r) throws IOException {
        reply(out, r.status, r.message);
    }

    private void reply(DataOutputStream out, ResponseStatus status, String msg) throws IOException {
        ProtocolConstants.writeResponse(out, status, msg);
    }
}
