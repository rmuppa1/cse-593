package com.networks.common;

/**
 * Protocol constants and commands used for communication between
 * client and server.
 */
public final class ProtocolConstants {

    private ProtocolConstants() {
        // Prevent instantiation
    }

    // Default connection settings
    public static final int DEFAULT_PORT = 8888;
    public static final String DEFAULT_HOST = "localhost";
    public static final int BUFFER_SIZE = 8192; // 8 KB chunks for file transfer

    // Authentication commands
    public static final String CMD_LOGIN = "LOGIN";

    // File operation commands
    public static final String CMD_LIST = "LIST";
    public static final String CMD_UPLOAD = "UPLOAD";
    public static final String CMD_DOWNLOAD = "DOWNLOAD";
    public static final String CMD_DELETE = "DELETE";
    public static final String CMD_INFO = "INFO";
    public static final String CMD_EXIT = "EXIT";

    // System information commands
    public static final String CMD_TIME = "TIME";
    public static final String CMD_UPTIME = "UPTIME";
    public static final String CMD_MEMORY = "MEMORY";
    public static final String CMD_CLIENTS = "CLIENTS";
    public static final String CMD_THREADS = "THREADS";

    // Intermediate protocol signals
    public static final String SIGNAL_READY = "READY";
    public static final String SIGNAL_ABORT = "ABORT";
}
