package edu.cse593.fileserver.client;

import edu.cse593.fileserver.protocol.Protocol;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Scanner;

/** Interactive text-menu TCP client. */
public final class ConsoleClient implements AutoCloseable {
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss z")
            .withZone(ZoneId.systemDefault());

    private final Socket socket;
    private final DataInputStream input;
    private final DataOutputStream output;
    private final Scanner console;

    public ConsoleClient(String host, int port, Scanner console) throws IOException {
        this.socket = new Socket(host, port);
        this.socket.setKeepAlive(true);
        this.input = new DataInputStream(new BufferedInputStream(socket.getInputStream()));
        this.output = new DataOutputStream(new BufferedOutputStream(socket.getOutputStream()));
        this.console = console;
    }

    public void run() throws IOException {
        if (!login()) return;
        boolean running = true;
        while (running) {
            printMenu();
            String choice = prompt("Select: ").trim().toUpperCase(Locale.ROOT);
            try {
                running = execute(choice);
            } catch (IOException e) {
                System.out.println("Operation failed: " + e.getMessage());
                if (socket.isClosed()) return;
            }
        }
    }

    private boolean login() throws IOException {
        System.out.println("Connected. Please authenticate (maximum 3 attempts). ");
        for (int attempt = 0; attempt < 3; attempt++) {
            String username = prompt("Username: ");
            String password = readPassword();
            output.writeUTF(Protocol.AUTH);
            output.writeUTF(username);
            output.writeUTF(password);
            output.flush();
            String status = input.readUTF();
            String message = input.readUTF();
            System.out.println(message);
            if (Protocol.OK.equals(status)) return true;
        }
        System.out.println("Too many failed attempts; connection closed.");
        return false;
    }

    private boolean execute(String choice) throws IOException {
        return switch (choice) {
            case "1", Protocol.LIST -> { list(); yield true; }
            case "2", Protocol.UPLOAD -> { upload(); yield true; }
            case "3", Protocol.DOWNLOAD -> { download(); yield true; }
            case "4", Protocol.DELETE -> { simpleFileCommand(Protocol.DELETE); yield true; }
            case "5", Protocol.INFO -> { info(); yield true; }
            case "6", Protocol.TIME -> { simpleCommand(Protocol.TIME); yield true; }
            case "7", Protocol.UPTIME -> { simpleCommand(Protocol.UPTIME); yield true; }
            case "8", Protocol.MEMORY -> { memory(); yield true; }
            case "9", Protocol.CLIENTS -> { clients(); yield true; }
            case "10", Protocol.THREADS -> { threads(); yield true; }
            case "0", "11", Protocol.EXIT -> { simpleCommand(Protocol.EXIT); yield false; }
            default -> { System.out.println("Unknown selection."); yield true; }
        };
    }

    private void list() throws IOException {
        output.writeUTF(Protocol.LIST);
        output.flush();
        if (!readSuccess()) return;
        int count = input.readInt();
        if (count == 0) {
            System.out.println("(shared directory is empty)");
            return;
        }
        System.out.printf("%-36s %12s  %s%n", "NAME", "BYTES", "MODIFIED");
        for (int i = 0; i < count; i++) {
            String name = input.readUTF();
            long size = input.readLong();
            long modified = input.readLong();
            System.out.printf("%-36s %12d  %s%n", name, size, formatTime(modified));
        }
    }

    private void upload() throws IOException {
        Path local = Path.of(prompt("Local file path: ")).toAbsolutePath().normalize();
        if (!Files.isRegularFile(local)) {
            System.out.println("Local file does not exist.");
            return;
        }
        String remoteName = prompt("Server file name [" + local.getFileName() + "]: ").trim();
        if (remoteName.isEmpty()) remoteName = local.getFileName().toString();
        long size = Files.size(local);
        output.writeUTF(Protocol.UPLOAD);
        output.writeUTF(remoteName);
        output.writeLong(size);
        output.flush();
        String status = input.readUTF();
        String message = input.readUTF();
        if (!Protocol.READY.equals(status)) {
            System.out.println("Error: " + message);
            return;
        }
        try (InputStream fileInput = Files.newInputStream(local)) {
            fileInput.transferTo(output);
        }
        output.flush();
        printResponse();
    }

    private void download() throws IOException {
        String remoteName = prompt("Server file name: ");
        Path destination = Path.of(prompt("Local destination path: ")).toAbsolutePath().normalize();
        output.writeUTF(Protocol.DOWNLOAD);
        output.writeUTF(remoteName);
        output.flush();
        String status = input.readUTF();
        String message = input.readUTF();
        if (!Protocol.OK.equals(status)) {
            System.out.println("Error: " + message);
            return;
        }
        long size = input.readLong();
        Path parent = destination.getParent();
        if (parent != null) Files.createDirectories(parent);
        try (OutputStream fileOutput = Files.newOutputStream(destination, StandardOpenOption.CREATE,
                StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE)) {
            copyExactly(input, fileOutput, size);
        }
        System.out.println("Downloaded " + size + " bytes to " + destination);
    }

    private void simpleFileCommand(String command) throws IOException {
        output.writeUTF(command);
        output.writeUTF(prompt("Server file name: "));
        output.flush();
        printResponse();
    }

    private void info() throws IOException {
        output.writeUTF(Protocol.INFO);
        output.writeUTF(prompt("Server file name: "));
        output.flush();
        if (!readSuccess()) return;
        String name = input.readUTF();
        long size = input.readLong();
        long modified = input.readLong();
        boolean readable = input.readBoolean();
        boolean writable = input.readBoolean();
        System.out.printf("Name: %s%nSize: %d bytes%nModified: %s%nReadable: %s%nWritable: %s%n",
                name, size, formatTime(modified), readable, writable);
    }

    private void memory() throws IOException {
        output.writeUTF(Protocol.MEMORY);
        output.flush();
        if (!readSuccess()) return;
        long used = input.readLong();
        long free = input.readLong();
        long total = input.readLong();
        long max = input.readLong();
        System.out.printf("Used: %s | Free: %s | Allocated: %s | Maximum: %s%n",
                humanBytes(used), humanBytes(free), humanBytes(total), humanBytes(max));
    }

    private void clients() throws IOException {
        output.writeUTF(Protocol.CLIENTS);
        output.flush();
        if (!readSuccess()) return;
        System.out.println("Connected clients: " + input.readInt());
        System.out.println("Authenticated clients: " + input.readInt());
    }

    private void threads() throws IOException {
        output.writeUTF(Protocol.THREADS);
        output.flush();
        if (!readSuccess()) return;
        System.out.println("Current thread-group estimate: " + input.readInt());
        System.out.println("Live JVM threads: " + input.readInt());
        System.out.println("Peak JVM threads: " + input.readInt());
    }

    private void simpleCommand(String command) throws IOException {
        output.writeUTF(command);
        output.flush();
        printResponse();
    }

    private boolean readSuccess() throws IOException {
        String status = input.readUTF();
        String message = input.readUTF();
        if (!Protocol.OK.equals(status)) {
            System.out.println("Error: " + message);
            return false;
        }
        if (!message.isBlank()) System.out.println(message);
        return true;
    }

    private void printResponse() throws IOException {
        String status = input.readUTF();
        String message = input.readUTF();
        System.out.println((Protocol.OK.equals(status) ? "OK: " : "Error: ") + message);
    }

    private String readPassword() {
        java.io.Console systemConsole = System.console();
        if (systemConsole != null) {
            char[] password = systemConsole.readPassword("Password: ");
            return password == null ? "" : new String(password);
        }
        return prompt("Password: ");
    }

    private String prompt(String text) {
        System.out.print(text);
        return console.nextLine();
    }

    private static void printMenu() {
        System.out.println("""

                === Multi-Client File and System Information Server ===
                 1. LIST       2. UPLOAD      3. DOWNLOAD
                 4. DELETE     5. INFO        6. TIME
                 7. UPTIME     8. MEMORY      9. CLIENTS
                10. THREADS    0. EXIT
                """);
    }

    private static String formatTime(long millis) {
        return DATE_FORMAT.format(Instant.ofEpochMilli(millis));
    }

    private static String humanBytes(long bytes) {
        double value = bytes;
        String[] units = {"B", "KiB", "MiB", "GiB", "TiB"};
        int unit = 0;
        while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit++; }
        return "%.2f %s".formatted(value, units[unit]);
    }

    private static void copyExactly(InputStream source, OutputStream destination, long size) throws IOException {
        byte[] buffer = new byte[Protocol.BUFFER_SIZE];
        long remaining = size;
        while (remaining > 0) {
            int count = source.read(buffer, 0, (int) Math.min(buffer.length, remaining));
            if (count < 0) throw new IOException("Server ended the download early");
            destination.write(buffer, 0, count);
            remaining -= count;
        }
    }

    @Override
    public void close() throws IOException {
        socket.close();
    }
}
