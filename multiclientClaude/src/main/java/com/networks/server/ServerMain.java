package com.networks.server;

import com.networks.server.auth.AuthService;
import com.networks.server.file.FileLockManager;
import com.networks.server.file.FileManager;
import com.networks.server.logging.ServerLogger;
import com.networks.server.system.SystemInfoService;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

/** Server entry point: usage {@code ServerMain [port] [storageDir]}. */
public class ServerMain {
    private static final AtomicInteger ACTIVE_CLIENTS = new AtomicInteger();

    public static void clientConnected() { ACTIVE_CLIENTS.incrementAndGet(); }
    public static void clientDisconnected() { ACTIVE_CLIENTS.decrementAndGet(); }
    public static int activeClients() { return ACTIVE_CLIENTS.get(); }

    public static void main(String[] args) throws IOException {
        ServerConfig cfg = ServerConfig.fromArgs(args);
        long startTime = System.currentTimeMillis();
        ServerLogger log = new ServerLogger(cfg.getLogFile());
        AuthService auth = new AuthService();
        FileManager files = new FileManager(cfg.getStorageDir(), new FileLockManager());
        SystemInfoService sys = new SystemInfoService(startTime, ServerMain::activeClients);
        ExecutorService pool = Executors.newFixedThreadPool(cfg.getThreadPoolSize());

        try (ServerSocket server = new ServerSocket(cfg.getPort())) {
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                log.info("Server shutting down");
                pool.shutdownNow();
                log.close();
            }));
            log.info("Server listening on port " + cfg.getPort() + ", storage: " + cfg.getStorageDir() +
                    ", pool size: " + cfg.getThreadPoolSize());
            while (true) {
                try {
                    Socket s = server.accept();
                    pool.submit(new ClientHandler(s, auth, files, sys, log, cfg.getMaxLoginAttempts()));
                } catch (IOException e) {
                    log.error("Accept failed: " + e.getMessage());
                }
            }
        }
    }
}
