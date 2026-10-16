package com.networks.client;

import com.networks.common.ProtocolConstants;
import com.networks.common.ResponseStatus;

import java.io.*;
import java.net.Socket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

/**
 * Encapsulates the network connection to the server, sending protocol
 * commands and receiving formatted responses or binary file streams.
 */
public class ClientConnection implements AutoCloseable {

    private final String host;
    private final int port;
    private Socket socket;
    private DataInputStream inStream;
    private DataOutputStream outStream;

    public ClientConnection(String host, int port) {
        this.host = host;
        this.port = port;
    }

    public void connect() throws IOException {
        this.socket = new Socket(host, port);
        this.inStream = new DataInputStream(new BufferedInputStream(socket.getInputStream()));
        this.outStream = new DataOutputStream(new BufferedOutputStream(socket.getOutputStream()));
    }

    public boolean isConnected() {
        return socket != null && socket.isConnected() && !socket.isClosed();
    }

    /**
     * Sends a simple command and expects a standard [Status, Message] pair.
     */
    public ServerResponse sendCommand(String command) throws IOException {
        outStream.writeUTF(command);
        outStream.flush();

        String statusStr = inStream.readUTF();
        String message = inStream.readUTF();
        return new ServerResponse(ResponseStatus.fromString(statusStr), message);
    }

    /**
     * Executes the LIST command, reading the returned list of entries.
     */
    public List<String> requestFileList() throws IOException {
        outStream.writeUTF(ProtocolConstants.CMD_LIST);
        outStream.flush();

        String statusStr = inStream.readUTF();
        ResponseStatus status = ResponseStatus.fromString(statusStr);

        if (status == ResponseStatus.SUCCESS) {
            int count = inStream.readInt();
            List<String> files = new ArrayList<>(count);
            for (int i = 0; i < count; i++) {
                files.add(inStream.readUTF());
            }
            return files;
        } else {
            String errorMsg = inStream.readUTF();
            throw new IOException("Server error during LIST: " + errorMsg);
        }
    }

    /**
     * Handles binary upload:
     * 1. Send UPLOAD <filename> <filesize>
     * 2. Wait for server SIGNAL_READY
     * 3. Stream binary bytes from local file
     * 4. Receive server final acknowledgement
     */
    public ServerResponse uploadFile(File localFile) throws IOException {
        if (!localFile.exists() || !localFile.isFile()) {
            return new ServerResponse(ResponseStatus.ERROR, "Local file not found: " + localFile.getAbsolutePath());
        }

        String filename = localFile.getName();
        long fileSize = localFile.length();

        // 1. Send command
        outStream.writeUTF(ProtocolConstants.CMD_UPLOAD + " " + filename + " " + fileSize);
        outStream.flush();

        // 2. Wait for READY acknowledgement
        String ack = inStream.readUTF();
        if (!ProtocolConstants.SIGNAL_READY.equals(ack)) {
            // Server may have rejected immediately (e.g. invalid filename or error)
            String msg = inStream.readUTF();
            return new ServerResponse(ResponseStatus.fromString(ack), msg);
        }

        // 3. Stream local file bytes
        try (InputStream fileIn = new BufferedInputStream(new FileInputStream(localFile))) {
            byte[] buffer = new byte[ProtocolConstants.BUFFER_SIZE];
            int read;
            long totalSent = 0;
            while ((read = fileIn.read(buffer)) != -1) {
                outStream.write(buffer, 0, read);
                totalSent += read;
            }
            outStream.flush();
        }

        // 4. Read server final response
        String statusStr = inStream.readUTF();
        String message = inStream.readUTF();
        return new ServerResponse(ResponseStatus.fromString(statusStr), message);
    }

    /**
     * Handles binary download:
     * 1. Send DOWNLOAD <filename>
     * 2. Read server response status (SUCCESS with length, or ERROR/LOCKED/NOT_FOUND)
     * 3. If SUCCESS, stream binary bytes and write to local destination
     */
    public ServerResponse downloadFile(String remoteFilename, String localDestinationPath) throws IOException {
        outStream.writeUTF(ProtocolConstants.CMD_DOWNLOAD + " " + remoteFilename);
        outStream.flush();

        String statusStr = inStream.readUTF();
        ResponseStatus status = ResponseStatus.fromString(statusStr);

        if (status != ResponseStatus.SUCCESS) {
            String message = inStream.readUTF();
            return new ServerResponse(status, message);
        }

        // Successful status - read expected size
        long fileSize = inStream.readLong();
        Path destPath = Paths.get(localDestinationPath).toAbsolutePath().normalize();

        // If localDestinationPath is a directory, append filename
        if (Files.isDirectory(destPath)) {
            destPath = destPath.resolve(remoteFilename);
        }

        try (OutputStream fileOut = new BufferedOutputStream(Files.newOutputStream(destPath))) {
            byte[] buffer = new byte[ProtocolConstants.BUFFER_SIZE];
            long bytesRemaining = fileSize;
            while (bytesRemaining > 0) {
                int readChunk = (int) Math.min(buffer.length, bytesRemaining);
                int read = inStream.read(buffer, 0, readChunk);
                if (read == -1) {
                    throw new EOFException("Connection interrupted before download finished.");
                }
                fileOut.write(buffer, 0, read);
                bytesRemaining -= read;
            }
            fileOut.flush();
        }

        return new ServerResponse(ResponseStatus.SUCCESS,
                "File saved successfully to: " + destPath.toString() + " (" + fileSize + " bytes)");
    }

    @Override
    public void close() {
        try {
            if (socket != null && !socket.isClosed()) {
                socket.close();
            }
        } catch (IOException ignored) {
        }
    }

    /**
     * Simple record to wrap server response status and message.
     */
    public record ServerResponse(ResponseStatus status, String message) {
        public boolean isSuccess() {
            return status == ResponseStatus.SUCCESS;
        }
    }
}
