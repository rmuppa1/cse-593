package com.networks.server.logging;

import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/** Thread-safe logger writing timestamped lines to the console and a log file. */
public class ServerLogger {
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");
    private final PrintWriter fileWriter;

    public ServerLogger(String path) throws IOException {
        this.fileWriter = new PrintWriter(Files.newBufferedWriter(Paths.get(path), StandardCharsets.UTF_8,
                StandardOpenOption.CREATE, StandardOpenOption.APPEND), true);
    }

    public synchronized void log(String level, String message) {
        String line = "[" + LocalDateTime.now().format(FMT) + "] [" + level + "] [" +
                Thread.currentThread().getName() + "] " + message;
        System.out.println(line);
        fileWriter.println(line);
    }

    public void info(String message) { log("INFO", message); }
    public void warn(String message) { log("WARN", message); }
    public void error(String message) { log("ERROR", message); }

    public synchronized void close() {
        fileWriter.close();
    }
}
