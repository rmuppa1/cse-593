package com.networks.server.logging;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class ServerLogger {
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");
    private final Path logFile;

    public ServerLogger() { this(Paths.get("server.log")); }

    public ServerLogger(Path logFile) { this.logFile = logFile; }

    public synchronized void log(String level, String message) {
        String line = "[" + LocalDateTime.now().format(FMT) + "] [" + level + "] "
                + message.replace('\r', ' ').replace('\n', ' ');
        System.out.println(line);
        try {
            Files.writeString(logFile, line + System.lineSeparator(), StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE, StandardOpenOption.APPEND);
        } catch (IOException e) {
            System.err.println("Failed to write log file: " + e.getMessage());
        }
    }

    public void info(String m) { log("INFO", m); }
    public void error(String m) { log("ERROR", m); }
    public void warn(String m) { log("WARN", m); }
}
