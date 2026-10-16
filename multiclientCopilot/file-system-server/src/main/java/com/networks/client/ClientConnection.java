package com.networks.client;

import com.networks.common.ProtocolConstants;
import com.networks.common.ResponseStatus;

import java.io.*;
import java.net.Socket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

public class ClientConnection implements Closeable {
    public record Response(ResponseStatus status, String message) {
        public boolean ok() { return status == ResponseStatus.SUCCESS; }
    }

    private final Socket socket;
    private final DataInputStream in;
    private final DataOutputStream out;

    public ClientConnection(String host, int port) throws IOException {
        socket = new Socket(host, port);
        in = new DataInputStream(new BufferedInputStream(socket.getInputStream()));
        out = new DataOutputStream(new BufferedOutputStream(socket.getOutputStream()));
    }

    private void send(String... parts) throws IOException {
        out.writeUTF(String.join(ProtocolConstants.DELIM, parts));
        out.flush();
    }

    private Response read() throws IOException {
        ResponseStatus s = ResponseStatus.valueOf(in.readUTF());
        return new Response(s, in.readUTF());
    }

    public Response command(String... parts) throws IOException {
        send(parts);
        return read();
    }

    public Response upload(Path file) throws IOException {
        long size = Files.size(file);
        Response r = command(ProtocolConstants.UPLOAD, file.getFileName().toString(), Long.toString(size));
        if (!r.ok()) return r;
        byte[] buf = new byte[ProtocolConstants.BUFFER_SIZE];
        try (InputStream fin = Files.newInputStream(file)) {
            long remaining = size;
            while (remaining > 0) {
                int n = fin.read(buf, 0, (int) Math.min(buf.length, remaining));
                if (n < 0) throw new EOFException("Local file shrank during upload");
                out.write(buf, 0, n);
                remaining -= n;
            }
        }
        out.flush();
        return read();
    }

    public Response download(String name, Path target) throws IOException {
        Response r = command(ProtocolConstants.DOWNLOAD, name);
        if (!r.ok()) return r;
        long size = in.readLong();
        Path tmp = Files.createTempFile(target.toAbsolutePath().getParent(), ".dl-", ".tmp");
        try {
            byte[] buf = new byte[ProtocolConstants.BUFFER_SIZE];
            try (OutputStream fout = Files.newOutputStream(tmp)) {
                long remaining = size;
                while (remaining > 0) {
                    int n = in.read(buf, 0, (int) Math.min(buf.length, remaining));
                    if (n < 0) throw new EOFException("Connection closed during download");
                    fout.write(buf, 0, n);
                    remaining -= n;
                }
            }
            Files.move(tmp, target, StandardCopyOption.REPLACE_EXISTING);
        } finally {
            Files.deleteIfExists(tmp);
        }
        return new Response(ResponseStatus.SUCCESS, "Downloaded " + size + " bytes to " + target);
    }

    @Override
    public void close() throws IOException {
        socket.close();
    }
}
