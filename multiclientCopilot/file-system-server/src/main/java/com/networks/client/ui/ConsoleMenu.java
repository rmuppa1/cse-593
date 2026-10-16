package com.networks.client.ui;

import com.networks.client.ClientConnection;
import com.networks.client.ClientConnection.Response;
import com.networks.common.ProtocolConstants;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class ConsoleMenu {
    private final ClientConnection conn;
    private final InputReader input;

    public ConsoleMenu(ClientConnection conn, InputReader input) {
        this.conn = conn;
        this.input = input;
    }

    private void show(Response r) {
        System.out.println("[" + r.status() + "] " + r.message());
    }

    /** Returns true if authenticated; false if the server disconnected us after too many failures. */
    public boolean authenticate() throws IOException {
        while (true) {
            String u = input.readLine("Username: ");
            String p = input.readLine("Password: ");
            Response r = conn.command(ProtocolConstants.LOGIN, u, p);
            show(r);
            if (r.ok()) return true;
            if (r.message().startsWith("Too many")) return false;
        }
    }

    private void printMenu() {
        System.out.println("\n=== Main Menu ===");
        System.out.println(" 1. List files        7. Server time");
        System.out.println(" 2. Upload file       8. Server uptime");
        System.out.println(" 3. Download file     9. Memory usage");
        System.out.println(" 4. Delete file      10. Connected clients");
        System.out.println(" 5. File info        11. Thread count");
        System.out.println(" 6. Exit");
    }

    public void run() throws IOException {
        while (true) {
            printMenu();
            String c = input.readLine("Choice: ");
            switch (c) {
                case "1" -> show(conn.command(ProtocolConstants.LIST));
                case "2" -> {
                    Path f = Paths.get(input.readLine("Local file path: "));
                    if (!Files.isRegularFile(f)) System.out.println("Local file not found.");
                    else show(conn.upload(f));
                }
                case "3" -> {
                    String name = input.readLine("Remote filename: ");
                    String dir = input.readLine("Save to directory [downloads]: ");
                    Path d = Paths.get(dir.isEmpty() ? "downloads" : dir);
                    Files.createDirectories(d);
                    Path target = d.resolve(Paths.get(name).getFileName());
                    show(conn.download(name, target));
                }
                case "4" -> show(conn.command(ProtocolConstants.DELETE, input.readLine("Remote filename: ")));
                case "5" -> show(conn.command(ProtocolConstants.INFO, input.readLine("Remote filename: ")));
                case "6" -> {
                    show(conn.command(ProtocolConstants.EXIT));
                    return;
                }
                case "7" -> show(conn.command(ProtocolConstants.TIME));
                case "8" -> show(conn.command(ProtocolConstants.UPTIME));
                case "9" -> show(conn.command(ProtocolConstants.MEMORY));
                case "10" -> show(conn.command(ProtocolConstants.CLIENTS));
                case "11" -> show(conn.command(ProtocolConstants.THREADS));
                default -> System.out.println("Invalid choice.");
            }
        }
    }
}
