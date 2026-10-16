package com.networks.server.logging;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Thread-safe logging service for recording server activity,
 * including client connections, commands executed, file transfers,
 * and errors, simultaneously outputting to console and a log file.
 */
public class ServerLogger {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");
    private final String logFilePath;
    private final Object lock = new Object();

    public ServerLogger(String logFilePath) {
        this.logFilePath = logFilePath;
    }

    public enum LogLevel {
        INFO, WARN, ERROR
    }

    private void log(LogLevel level, String clientTag, String message) {
        String timestamp = LocalDateTime.now().format(FORMATTER);
        String threadName = Thread.currentThread().getName();
        String formattedMessage = String.format("[%s] [%s] [%-5s] %s%s",
                timestamp,
                threadName,
                level.name(),
                (clientTag != null && !clientTag.isEmpty() ? "[" + clientTag + "] " : ""),
                message
        );

        synchronized (lock) {
            // Console output
            if (level == LogLevel.ERROR) {
                System.err.println(formattedMessage);
            } else {
                System.out.println(formattedMessage);
            }

            // File output
            if (logFilePath != null) {
                try (PrintWriter out = new PrintWriter(new BufferedWriter(new FileWriter(logFilePath, true)))) {
                    out.println(formattedMessage);
                } catch (IOException e) {
                    System.err.println("Failed to write to log file: " + e.getMessage());
                }
            }
        }
    }

    public void info(String message) {
        log(LogLevel.INFO, null, message);
    }

    public void info(String clientTag, String message) {
        log(LogLevel.INFO, clientTag, message);
    }

    public void warn(String clientTag, String message) {
        log(LogLevel.WARN, clientTag, message);
    }

    public void error(String message) {
        log(LogLevel.ERROR, null, message);
    }

    public void error(String clientTag, String message) {
        log(LogLevel.ERROR, clientTag, message);
    }

    public void error(String clientTag, String message, Throwable throwable) {
        log(LogLevel.ERROR, clientTag, message + " - Exception: " + throwable.getMessage());
    }
}
