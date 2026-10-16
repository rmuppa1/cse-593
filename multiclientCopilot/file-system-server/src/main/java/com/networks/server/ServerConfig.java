package com.networks.server;

import com.networks.common.ProtocolConstants;
import java.nio.file.Path;
import java.nio.file.Paths;

public class ServerConfig {
    private final int port;
    private final Path storageDir;
    private final int maxLoginAttempts = 3;
    private final int threadPoolSize = 20;
    private final long maxUploadBytes = 1L << 30;

    public ServerConfig(int port, Path storageDir) {
        this.port = port;
        this.storageDir = storageDir;
    }

    public static ServerConfig fromArgs(String[] args) {
        int port = args.length > 0 ? Integer.parseInt(args[0]) : ProtocolConstants.DEFAULT_PORT;
        Path dir = Paths.get(args.length > 1 ? args[1] : "server-storage");
        return new ServerConfig(port, dir);
    }

    public int getPort() { return port; }
    public Path getStorageDir() { return storageDir; }
    public int getMaxLoginAttempts() { return maxLoginAttempts; }
    public int getThreadPoolSize() { return threadPoolSize; }
    public long getMaxUploadBytes() { return maxUploadBytes; }
}
