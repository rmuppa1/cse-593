package com.networks.client.ui;

import com.networks.client.ClientConnection;
import com.networks.client.ClientConnection.Response;
import com.networks.common.ProtocolConstants;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/** Text menus: login, then the main command loop. */
public class ConsoleMenu {
    private static final Path DOWNLOAD_DIR = Paths.get("client-downloads");
    private final ClientConnection conn;
    private final InputReader input;

    public ConsoleMenu(ClientConnection conn, InputReader input) {
        this.conn = conn;
        this.input = input;
    }

    /** Runs login then the menu loop until the user exits or the connection drops. */
    public void run() {
        try {
            if (!authenticate()) {
                return;
            }
            mainLoop();
        } catch (IOException e) {
            System.out.println("Connection error: " + e.getMessage());
        }
    }

    private boolean authenticate() throws IOException {
        System.out.println("=== Login ===");
        while (true) {
            String u = input.readLine("Username: ");
            if (u == null) return false;
            String p = input.readLine("Password: ");
            if (p == null) return false;
            if (u.isEmpty() || u.contains(" ")) {
                System.out.println("Invalid username.");
                continue;
            }
            Response r = conn.login(u, p);
            System.out.println(r.message);
            if (r.ok()) return true;
            if (r.message.startsWith("Too many")) return false;
        }
    }

    private void printMenu() {
        System.out.println();
        System.out.println("===== Main Menu =====");
        System.out.println(" File operations");
        System.out.println("  1. List files");
        System.out.println("  2. Upload file");
        System.out.println("  3. Download file");
        System.out.println("  4. Delete file");
        System.out.println("  5. File info");
        System.out.println("  6. Exit");
        System.out.println(" System information");
        System.out.println("  7. Server time");
        System.out.println("  8. Server uptime");
        System.out.println("  9. Memory usage");
        System.out.println(" 10. Connected clients");
        System.out.println(" 11. Thread information");
        System.out.println("=====================");
    }

    private void mainLoop() throws IOException {
        while (true) {
            printMenu();
            String choice = input.readLine("Choice: ");
            if (choice == null) {
                exit();
                return;
            }
            switch (choice) {
                case "1": show(conn.request(ProtocolConstants.LIST)); break;
                case "2": upload(); break;
                case "3": download(); break;
                case "4": withName("Filename to delete: ", ProtocolConstants.DELETE); break;
                case "5": withName("Filename: ", ProtocolConstants.INFO); break;
                case "6": exit(); return;
                case "7": show(conn.request(ProtocolConstants.TIME)); break;
                case "8": show(conn.request(ProtocolConstants.UPTIME)); break;
                case "9": show(conn.request(ProtocolConstants.MEMORY)); break;
                case "10": show(conn.request(ProtocolConstants.CLIENTS)); break;
                case "11": show(conn.request(ProtocolConstants.THREADS)); break;
                default: System.out.println("Invalid choice.");
            }
        }
    }

    private void exit() {
        try {
            conn.request(ProtocolConstants.EXIT);
        } catch (IOException ignored) {
            // server may already be gone
        }
        System.out.println("Goodbye.");
    }

    private void show(Response r) {
        if (r.ok()) {
            System.out.println(r.message);
        } else {
            System.out.println("[" + r.status + "] " + r.message);
        }
    }

    private void withName(String prompt, String cmd) throws IOException {
        String name = input.readLine(prompt);
        if (name == null || name.isEmpty()) {
            System.out.println("No filename given.");
            return;
        }
        show(conn.request(cmd + " " + name));
    }

    private void upload() throws IOException {
        String path = input.readLine("Local file path to upload: ");
        if (path == null || path.isEmpty()) return;
        Path p = Paths.get(path);
        if (!Files.isRegularFile(p)) {
            System.out.println("Local file not found: " + path);
            return;
        }
        show(conn.upload(p));
    }

    private void download() throws IOException {
        String name = input.readLine("Filename to download: ");
        if (name == null || name.isEmpty()) return;
        show(conn.download(name, DOWNLOAD_DIR));
    }
}
