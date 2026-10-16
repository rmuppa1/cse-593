package com.networks.server;

import com.networks.common.ProtocolConstants;
import com.networks.common.ResponseStatus;
import com.networks.server.auth.AuthService;
import com.networks.server.auth.UserAccount;
import com.networks.server.file.FileManager;
import com.networks.server.logging.ServerLogger;
import com.networks.server.system.SystemInfoService;

import java.io.*;
import java.net.Socket;
import java.net.SocketException;
import java.util.List;

/**
 * Handles communication with an individual client connection.
 * Runs on a thread managed by ServerMain's ExecutorService.
 */
public class ClientHandler implements Runnable {

    private final Socket clientSocket;
    private final ServerConfig config;
    private final AuthService authService;
    private final FileManager fileManager;
    private final SystemInfoService systemInfoService;
    private final ServerLogger logger;
    private final Runnable onDisconnectCallback;

    private DataInputStream inStream;
    private DataOutputStream outStream;
    private String clientTag;
    private UserAccount authenticatedUser;
    private int failedLoginAttempts = 0;
    private volatile boolean running = true;

    public ClientHandler(Socket clientSocket,
                         ServerConfig config,
                         AuthService authService,
                         FileManager fileManager,
                         SystemInfoService systemInfoService,
                         ServerLogger logger,
                         Runnable onDisconnectCallback) {
        this.clientSocket = clientSocket;
        this.config = config;
        this.authService = authService;
        this.fileManager = fileManager;
        this.systemInfoService = systemInfoService;
        this.logger = logger;
        this.onDisconnectCallback = onDisconnectCallback;
        this.clientTag = clientSocket.getRemoteSocketAddress().toString();
    }

    @Override
    public void run() {
        logger.info(clientTag, "Accepted connection from " + clientSocket.getRemoteSocketAddress());
        try {
            inStream = new DataInputStream(new BufferedInputStream(clientSocket.getInputStream()));
            outStream = new DataOutputStream(new BufferedOutputStream(clientSocket.getOutputStream()));

            // Main request dispatching loop
            while (running && !clientSocket.isClosed()) {
                String commandLine;
                try {
                    commandLine = inStream.readUTF();
                } catch (EOFException | SocketException e) {
                    // Client disconnected
                    break;
                }

                if (commandLine == null) {
                    break;
                }

                commandLine = commandLine.trim();
                if (commandLine.isEmpty()) {
                    continue;
                }

                handleCommand(commandLine);
            }

        } catch (IOException e) {
            logger.warn(clientTag, "Connection issue: " + e.getMessage());
        } finally {
            cleanup();
        }
    }

    private void handleCommand(String commandLine) throws IOException {
        String[] parts = commandLine.split("\\s+", 3);
        String command = parts[0].toUpperCase();

        logger.info(clientTag, "Received command: " + commandLine);

        // Allow EXIT and LOGIN before authentication
        if (command.equals(ProtocolConstants.CMD_EXIT)) {
            sendResponse(ResponseStatus.SUCCESS, "Goodbye.");
            running = false;
            return;
        }

        if (authenticatedUser == null) {
            if (command.equals(ProtocolConstants.CMD_LOGIN)) {
                handleLogin(parts);
            } else {
                sendResponse(ResponseStatus.UNAUTHORIZED, "Access denied. Please authenticate with LOGIN first.");
            }
            return;
        }

        // Authenticated routes
        switch (command) {
            case ProtocolConstants.CMD_LIST -> handleList();
            case ProtocolConstants.CMD_INFO -> handleInfo(parts);
            case ProtocolConstants.CMD_DELETE -> handleDelete(parts);
            case ProtocolConstants.CMD_UPLOAD -> handleUpload(parts);
            case ProtocolConstants.CMD_DOWNLOAD -> handleDownload(parts);
            case ProtocolConstants.CMD_TIME -> sendResponse(ResponseStatus.SUCCESS, systemInfoService.getServerTime());
            case ProtocolConstants.CMD_UPTIME -> sendResponse(ResponseStatus.SUCCESS, systemInfoService.getUptime());
            case ProtocolConstants.CMD_MEMORY -> sendResponse(ResponseStatus.SUCCESS, systemInfoService.getMemoryInfo());
            case ProtocolConstants.CMD_CLIENTS -> sendResponse(ResponseStatus.SUCCESS, systemInfoService.getActiveClientsCount());
            case ProtocolConstants.CMD_THREADS -> sendResponse(ResponseStatus.SUCCESS, systemInfoService.getThreadInfo());
            default -> sendResponse(ResponseStatus.ERROR, "Unknown command: '" + command + "'.");
        }
    }

    private void handleLogin(String[] parts) throws IOException {
        if (parts.length < 3) {
            sendResponse(ResponseStatus.ERROR, "Usage: LOGIN <username> <password>");
            return;
        }

        String username = parts[1];
        String password = parts[2];

        UserAccount user = authService.authenticate(username, password);
        if (user != null) {
            this.authenticatedUser = user;
            this.failedLoginAttempts = 0;
            this.clientTag = user.getUsername() + "@" + clientSocket.getRemoteSocketAddress();
            logger.info(clientTag, "User '" + username + "' authenticated successfully.");
            sendResponse(ResponseStatus.SUCCESS, "Authentication successful. Welcome " + user.getUsername() + "!");
        } else {
            failedLoginAttempts++;
            int remaining = config.getMaxFailedLogins() - failedLoginAttempts;
            logger.warn(clientTag, "Failed login attempt (" + failedLoginAttempts + "/" + config.getMaxFailedLogins() + ") for user: " + username);

            if (failedLoginAttempts >= config.getMaxFailedLogins()) {
                sendResponse(ResponseStatus.UNAUTHORIZED, "Maximum failed login attempts reached (3). Terminating connection.");
                running = false;
            } else {
                sendResponse(ResponseStatus.UNAUTHORIZED, "Invalid username or password. Remaining attempts: " + remaining);
            }
        }
    }

    private void handleList() throws IOException {
        try {
            List<String> files = fileManager.listFiles();
            outStream.writeUTF(ResponseStatus.SUCCESS.name());
            outStream.writeInt(files.size());
            for (String fileEntry : files) {
                outStream.writeUTF(fileEntry);
            }
            outStream.flush();
            logger.info(clientTag, "Listed " + files.size() + " files.");
        } catch (IOException e) {
            logger.error(clientTag, "Failed to list files: " + e.getMessage());
            sendResponse(ResponseStatus.ERROR, "Failed to list files: " + e.getMessage());
        }
    }

    private void handleInfo(String[] parts) throws IOException {
        if (parts.length < 2) {
            sendResponse(ResponseStatus.ERROR, "Usage: INFO <filename>");
            return;
        }
        String filename = parts[1];
        try {
            String info = fileManager.getFileInfo(filename);
            if (info == null) {
                sendResponse(ResponseStatus.NOT_FOUND, "File '" + filename + "' not found.");
            } else {
                sendResponse(ResponseStatus.SUCCESS, info);
            }
        } catch (SecurityException se) {
            sendResponse(ResponseStatus.ERROR, se.getMessage());
        } catch (IOException e) {
            sendResponse(ResponseStatus.ERROR, "Error reading file metadata: " + e.getMessage());
        }
    }

    private void handleDelete(String[] parts) throws IOException {
        if (parts.length < 2) {
            sendResponse(ResponseStatus.ERROR, "Usage: DELETE <filename>");
            return;
        }
        String filename = parts[1];
        StringBuilder message = new StringBuilder();
        ResponseStatus status = fileManager.deleteFile(filename, message);

        sendResponse(status, message.toString());
        if (status == ResponseStatus.SUCCESS) {
            logger.info(clientTag, "Deleted file: " + filename);
        } else {
            logger.warn(clientTag, "Delete failed for '" + filename + "': " + message);
        }
    }

    private void handleUpload(String[] parts) throws IOException {
        if (parts.length < 3) {
            sendResponse(ResponseStatus.ERROR, "Usage: UPLOAD <filename> <file_size>");
            return;
        }

        String filename = parts[1];
        long fileSize;
        try {
            fileSize = Long.parseLong(parts[2]);
            if (fileSize < 0) throw new NumberFormatException("Negative file size");
        } catch (NumberFormatException e) {
            sendResponse(ResponseStatus.ERROR, "Invalid file size specified: " + parts[2]);
            return;
        }

        // Send ready acknowledgement to proceed with binary streaming
        outStream.writeUTF(ProtocolConstants.SIGNAL_READY);
        outStream.flush();

        logger.info(clientTag, "Receiving upload: " + filename + " (" + fileSize + " bytes)");

        StringBuilder message = new StringBuilder();
        ResponseStatus status = fileManager.saveUploadedFile(filename, fileSize, inStream, message);

        sendResponse(status, message.toString());
        if (status == ResponseStatus.SUCCESS) {
            logger.info(clientTag, "Upload finished: " + filename + " (" + fileSize + " bytes)");
        } else {
            logger.warn(clientTag, "Upload failed for '" + filename + "': " + message);
        }
    }

    private void handleDownload(String[] parts) throws IOException {
        if (parts.length < 2) {
            sendResponse(ResponseStatus.ERROR, "Usage: DOWNLOAD <filename>");
            return;
        }

        String filename = parts[1];
        long fileSize = fileManager.getFileSize(filename);
        if (fileSize < 0) {
            sendResponse(ResponseStatus.NOT_FOUND, "File '" + filename + "' does not exist.");
            return;
        }

        // Notify client that server is ready with the file size
        outStream.writeUTF(ResponseStatus.SUCCESS.name());
        outStream.writeLong(fileSize);
        outStream.flush();

        logger.info(clientTag, "Streaming download: " + filename + " (" + fileSize + " bytes)");

        StringBuilder message = new StringBuilder();
        long[] sizeArr = new long[1];
        ResponseStatus status = fileManager.streamDownloadFile(filename, outStream, message, sizeArr);

        if (status == ResponseStatus.SUCCESS) {
            logger.info(clientTag, "Download completed: " + filename + " (" + sizeArr[0] + " bytes)");
        } else {
            logger.warn(clientTag, "Download failed for '" + filename + "': " + message);
        }
    }

    private void sendResponse(ResponseStatus status, String message) throws IOException {
        outStream.writeUTF(status.name());
        outStream.writeUTF(message != null ? message : "");
        outStream.flush();
    }

    private void cleanup() {
        try {
            running = false;
            if (clientSocket != null && !clientSocket.isClosed()) {
                clientSocket.close();
            }
        } catch (IOException ignored) {
        } finally {
            onDisconnectCallback.run();
            logger.info(clientTag, "Connection terminated.");
        }
    }
}
