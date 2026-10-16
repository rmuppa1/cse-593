package com.networks.server;

import com.networks.server.auth.AuthService;
import com.networks.server.file.FileManager;
import com.networks.server.logging.ServerLogger;
import com.networks.server.system.SystemInfoService;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;
import java.time.Instant;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.atomic.AtomicInteger;

public class ServerMain {
    public static void main(String[] args) throws IOException {
        ServerConfig config = ServerConfig.fromArgs(args);
        ServerLogger log = new ServerLogger();
        AtomicInteger clients = new AtomicInteger();
        AuthService auth = new AuthService();
        FileManager files = new FileManager(config.getStorageDir(), config.getMaxUploadBytes());
        SystemInfoService sys = new SystemInfoService(Instant.now(), clients::get);
        ExecutorService pool = Executors.newFixedThreadPool(config.getThreadPoolSize());

        try (ServerSocket server = new ServerSocket(config.getPort())) {
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                pool.shutdownNow();
                log.info("Server shutting down");
            }));
            log.info("Server listening on port " + config.getPort() + ", storage: " + config.getStorageDir().toAbsolutePath());
            while (true) {
                Socket s;
                try {
                    s = server.accept();
                } catch (IOException e) {
                    log.error("Accept failed: " + e.getMessage());
                    continue;
                }
                clients.incrementAndGet();
                try {
                    pool.execute(new ClientHandler(s, config, auth, files, sys, log, clients::decrementAndGet));
                } catch (RejectedExecutionException e) {
                    clients.decrementAndGet();
                    s.close();
                }
            }
        }
    }
}
