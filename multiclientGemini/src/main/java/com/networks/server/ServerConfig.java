package com.networks.server;

/**
 * Server runtime configuration holding port, storage location,
 * thread pool sizing, and security thresholds.
 */
public class ServerConfig {

    private final int port;
    private final String storageDir;
    private final String logFile;
    private final int maxFailedLogins;
    private final int threadPoolSize;

    public ServerConfig() {
        this(8888, "server-storage", "server.log", 3, 20);
    }

    public ServerConfig(int port, String storageDir, String logFile, int maxFailedLogins, int threadPoolSize) {
        this.port = port;
        this.storageDir = storageDir;
        this.logFile = logFile;
        this.maxFailedLogins = maxFailedLogins;
        this.threadPoolSize = threadPoolSize;
    }

    public int getPort() {
        return port;
    }

    public String getStorageDir() {
        return storageDir;
    }

    public String getLogFile() {
        return logFile;
    }

    public int getMaxFailedLogins() {
        return maxFailedLogins;
    }

    public int getThreadPoolSize() {
        return threadPoolSize;
    }
}
