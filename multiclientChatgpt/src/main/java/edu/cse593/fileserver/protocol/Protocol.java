package edu.cse593.fileserver.protocol;

/** Constants shared by the client and server wire protocol. */
public final class Protocol {
    public static final String AUTH = "AUTH";
    public static final String OK = "OK";
    public static final String ERROR = "ERROR";
    public static final String READY = "READY";

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

    public static final int BUFFER_SIZE = 64 * 1024;

    private Protocol() { }
}
