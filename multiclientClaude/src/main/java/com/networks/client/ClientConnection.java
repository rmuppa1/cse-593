package com.networks.client;

import com.networks.common.ProtocolConstants;
import com.networks.common.ResponseStatus;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.Closeable;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

/** Wraps the client socket and implements the client side of the protocol. */
public class ClientConnection implements Closeable {

    /** A server response. */
    public static class Response {
        public final ResponseStatus status;
        public final String message;

        Response(ResponseStatus status, String message) {
            this.status = status;
            this.message = message;
        }

        public boolean ok() { return status == ResponseStatus.SUCCESS; }
    }

    private final Socket socket;
    private final DataInputStream in;
    private final DataOutputStream out;

    public ClientConnection(String host, int port) throws IOException {
        this.socket = new Socket(host, port);
        this.in = new DataInputStream(new BufferedInputStream(socket.getInputStream()));
        this.out = new DataOutputStream(new BufferedOutputStream(socket.getOutputStream()));
    }

    private void sendCommand(String cmd) throws IOException {
        ProtocolConstants.writeText(out, cmd);
        out.flush();
    }

    private Response readResponse() throws IOException {
        String st = ProtocolConstants.readText(in);
        String msg = ProtocolConstants.readText(in);
        ResponseStatus status;
        try {
            status = ResponseStatus.valueOf(st);
        } catch (IllegalArgumentException e) {
            status = ResponseStatus.ERROR;
        }
        return new Response(status, msg);
    }

    /** Sends a simple command and reads its single response. */
    public Response request(String cmd) throws IOException {
        sendCommand(cmd);
        return readResponse();
    }

    public Response login(String user, String pass) throws IOException {
        return request(ProtocolConstants.LOGIN + " " + user + " " + pass);
    }

    public Response upload(Path file) throws IOException {
        long size = Files.size(file);
        String name = file.getFileName().toString();
        sendCommand(ProtocolConstants.UPLOAD + " " + size + " " + name);
        Response ready = readResponse();
        if (!ready.ok()) return ready;
        try (InputStream fi = Files.newInputStream(file)) {
            byte[] buf = new byte[ProtocolConstants.BUFFER_SIZE];
            long remaining = size;
            while (remaining > 0) {
                int n = fi.read(buf, 0, (int) Math.min(buf.length, remaining));
                if (n < 0) throw new IOException("File changed during upload");
                out.write(buf, 0, n);
                remaining -= n;
            }
        }
        out.flush();
        return readResponse();
    }

    /** Downloads {@code name} into {@code destDir}; the message holds the saved path on success. */
    public Response download(String name, Path destDir) throws IOException {
        sendCommand(ProtocolConstants.DOWNLOAD + " " + name);
        Response r = readResponse();
        if (!r.ok()) return r;
        long size = in.readLong();
        Files.createDirectories(destDir);
        Path dest = destDir.resolve(Path.of(name).getFileName().toString());
        Path tmp = Files.createTempFile(destDir, ".dl-", ".tmp");
        try {
            try (OutputStream fo = Files.newOutputStream(tmp)) {
                byte[] buf = new byte[ProtocolConstants.BUFFER_SIZE];
                long remaining = size;
                while (remaining > 0) {
                    int n = in.read(buf, 0, (int) Math.min(buf.length, remaining));
                    if (n < 0) throw new IOException("Connection closed during download");
                    fo.write(buf, 0, n);
                    remaining -= n;
                }
            }
            Files.move(tmp, dest, StandardCopyOption.REPLACE_EXISTING);
        } finally {
            Files.deleteIfExists(tmp);
        }
        return new Response(ResponseStatus.SUCCESS, "Saved " + dest.toAbsolutePath() + " (" + size + " bytes)");
    }

    @Override
    public void close() {
        try {
            socket.close();
        } catch (IOException ignored) {
            // nothing useful to do
        }
    }
}
