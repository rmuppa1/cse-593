package com.networks.common;

public final class ProtocolConstants {
    private ProtocolConstants() {}

    public static final int DEFAULT_PORT = 5000;
    public static final int BUFFER_SIZE = 8192;
    /** Separator between command arguments (tab, so filenames may contain spaces). */
    public static final String DELIM = "\t";

    public static final String LOGIN = "LOGIN";
    public static final String LIST = "LIST";
    public static final String UPLOAD = "UPLOAD";
    public static final String DOWNLOAD = "DOWNLOAD";
    public static final String DELETE = "DELETE";
    public static final String INFO = "INFO";
    public static final String TIME = "TIME";
    public static final String UPTIME = "UPTIME";
    public static final String MEMORY = "MEMORY";
    public static final String CLIENTS = "CLIENTS";
    public static final String THREADS = "THREADS";
    public static final String EXIT = "EXIT";
}
