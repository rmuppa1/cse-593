package com.networks.client.ui;

import com.networks.client.ClientConnection;
import com.networks.common.ProtocolConstants;
import com.networks.common.ResponseStatus;

import java.io.File;
import java.io.IOException;
import java.util.List;

/**
 * Text-based interactive console menu for the client application.
 */
public class ConsoleMenu {

    private final ClientConnection connection;
    private final InputReader inputReader;

    public ConsoleMenu(ClientConnection connection, InputReader inputReader) {
        this.connection = connection;
        this.inputReader = inputReader;
    }

    /**
     * Authenticates user against the server. Allows up to 3 failed attempts.
     */
    public boolean performLogin() {
        System.out.println("==================================================");
        System.out.println("        CLIENT AUTHENTICATION REQUIRED            ");
        System.out.println("==================================================");
        System.out.println("Default pre-configured accounts:");
        System.out.println("  1) admin   / admin123");
        System.out.println("  2) alice   / alicePass!");
        System.out.println("  3) bob     / bobSecret#9");
        System.out.println("==================================================");

        int attempts = 0;
        final int MAX_ATTEMPTS = 3;

        while (attempts < MAX_ATTEMPTS) {
            String username = inputReader.readLine("Enter username: ");
            if (username == null || username.isEmpty()) {
                System.out.println("Username cannot be empty.");
                continue;
            }

            String password = inputReader.readLine("Enter password: ");
            if (password == null || password.isEmpty()) {
                System.out.println("Password cannot be empty.");
                continue;
            }

            try {
                ClientConnection.ServerResponse response = connection.sendCommand(
                        ProtocolConstants.CMD_LOGIN + " " + username + " " + password);

                if (response.isSuccess()) {
                    System.out.println("\n[+] " + response.message());
                    return true;
                } else {
                    attempts++;
                    System.out.println("\n[-] Authentication Failed: " + response.message());
                    if (attempts >= MAX_ATTEMPTS || response.status() == ResponseStatus.UNAUTHORIZED && response.message().contains("Terminating")) {
                        System.out.println("[-] Disconnected by server: Max login attempts reached.");
                        return false;
                    }
                }
            } catch (IOException e) {
                System.err.println("Communication error during login: " + e.getMessage());
                return false;
            }
        }
        return false;
    }

    /**
     * Main interaction menu displayed after successful authentication.
     */
    public void runMenuLoop() {
        boolean active = true;

        while (active && connection.isConnected()) {
            displayMenu();
            int choice = inputReader.readInt("Select option (1-12): ", 1, 12);

            try {
                switch (choice) {
                    case 1 -> handleList();
                    case 2 -> handleUpload();
                    case 3 -> handleDownload();
                    case 4 -> handleDelete();
                    case 5 -> handleInfo();
                    case 6 -> handleSystemCommand(ProtocolConstants.CMD_TIME, "Server Time");
                    case 7 -> handleSystemCommand(ProtocolConstants.CMD_UPTIME, "Server Uptime");
                    case 8 -> handleSystemCommand(ProtocolConstants.CMD_MEMORY, "Server Memory");
                    case 9 -> handleSystemCommand(ProtocolConstants.CMD_CLIENTS, "Active Clients");
                    case 10 -> handleSystemCommand(ProtocolConstants.CMD_THREADS, "JVM Threads");
                    case 11 -> handleCustomCommand();
                    case 12 -> {
                        handleExit();
                        active = false;
                    }
                }
            } catch (IOException e) {
                System.err.println("Connection error: " + e.getMessage());
                active = false;
            }

            if (active) {
                System.out.println("\nPress ENTER to continue...");
                inputReader.readLine("");
            }
        }
    }

    private void displayMenu() {
        System.out.println("\n==================================================");
        System.out.println("   MULTI-CLIENT FILE & SYSTEM INFORMATION MENU    ");
        System.out.println("==================================================");
        System.out.println("  --- FILE OPERATIONS ---");
        System.out.println("  [1] LIST       - View all files in shared directory");
        System.out.println("  [2] UPLOAD     - Upload a local file to server");
        System.out.println("  [3] DOWNLOAD   - Download a file from server");
        System.out.println("  [4] DELETE     - Delete a file on server");
        System.out.println("  [5] INFO       - View file metadata");
        System.out.println("  --- SYSTEM INFORMATION ---");
        System.out.println("  [6] TIME       - Query server current timestamp");
        System.out.println("  [7] UPTIME     - Query server uptime");
        System.out.println("  [8] MEMORY     - Query server JVM memory stats");
        System.out.println("  [9] CLIENTS    - Query connected client count");
        System.out.println("  [10] THREADS   - Query active JVM threads count");
        System.out.println("  --- GENERAL ---");
        System.out.println("  [11] RAW CMD   - Send raw protocol command");
        System.out.println("  [12] EXIT      - Disconnect and exit");
        System.out.println("==================================================");
    }

    private void handleList() throws IOException {
        System.out.println("\n--- Shared Directory Files ---");
        List<String> files = connection.requestFileList();
        if (files.isEmpty()) {
            System.out.println("(No files found in shared storage)");
        } else {
            System.out.printf("%-25s | %10s       | %s%n", "Filename", "Size", "Last Modified");
            System.out.println("------------------------------------------------------------------");
            for (String fileEntry : files) {
                System.out.println(fileEntry);
            }
        }
    }

    private void handleUpload() throws IOException {
        String path = inputReader.readLine("Enter local file path to upload: ");
        if (path == null || path.isEmpty()) return;

        File localFile = new File(path);
        if (!localFile.exists() || !localFile.isFile()) {
            System.out.println("Error: File does not exist or is a directory.");
            return;
        }

        System.out.println("Uploading '" + localFile.getName() + "' (" + localFile.length() + " bytes)...");
        ClientConnection.ServerResponse resp = connection.uploadFile(localFile);
        printResponse(resp);
    }

    private void handleDownload() throws IOException {
        String remoteFilename = inputReader.readLine("Enter remote filename to download: ");
        if (remoteFilename == null || remoteFilename.isEmpty()) return;

        String localDest = inputReader.readLine("Enter local destination directory or filepath (default '.'): ");
        if (localDest == null || localDest.isEmpty()) {
            localDest = ".";
        }

        System.out.println("Downloading '" + remoteFilename + "'...");
        ClientConnection.ServerResponse resp = connection.downloadFile(remoteFilename, localDest);
        printResponse(resp);
    }

    private void handleDelete() throws IOException {
        String filename = inputReader.readLine("Enter filename to delete: ");
        if (filename == null || filename.isEmpty()) return;

        String confirm = inputReader.readLine("Are you sure you want to delete '" + filename + "'? (y/N): ");
        if (confirm == null || !confirm.equalsIgnoreCase("y")) {
            System.out.println("Deletion canceled.");
            return;
        }

        ClientConnection.ServerResponse resp = connection.sendCommand(ProtocolConstants.CMD_DELETE + " " + filename);
        printResponse(resp);
    }

    private void handleInfo() throws IOException {
        String filename = inputReader.readLine("Enter filename to query: ");
        if (filename == null || filename.isEmpty()) return;

        ClientConnection.ServerResponse resp = connection.sendCommand(ProtocolConstants.CMD_INFO + " " + filename);
        printResponse(resp);
    }

    private void handleSystemCommand(String cmd, String title) throws IOException {
        ClientConnection.ServerResponse resp = connection.sendCommand(cmd);
        System.out.println("\n[" + title + "]");
        System.out.println(resp.message());
    }

    private void handleCustomCommand() throws IOException {
        String raw = inputReader.readLine("Enter raw command: ");
        if (raw == null || raw.isEmpty()) return;
        ClientConnection.ServerResponse resp = connection.sendCommand(raw);
        printResponse(resp);
    }

    private void handleExit() {
        try {
            connection.sendCommand(ProtocolConstants.CMD_EXIT);
        } catch (IOException ignored) {
        }
        System.out.println("Disconnected from server. Goodbye!");
    }

    private void printResponse(ClientConnection.ServerResponse resp) {
        if (resp.isSuccess()) {
            System.out.println("\n[SUCCESS] " + resp.message());
        } else {
            System.out.println("\n[" + resp.status() + "] " + resp.message());
        }
    }
}
