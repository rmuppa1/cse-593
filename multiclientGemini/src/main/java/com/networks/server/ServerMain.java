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

/**
 * Entry point for the server application:
 * - Initializes configurations, auth, file manager, system info, and logger.
 * - Manages an ExecutorService thread pool supporting concurrent clients (default 20, >5 minimum).
 * - Binds ServerSocket and accepts connections in a non-blocking loop.
 * - Handles graceful shutdown via runtime hook.
 */
public class ServerMain {

    private final ServerConfig config;
    private final ServerLogger logger;
    private final AuthService authService;
    private final FileLockManager lockManager;
    private final FileManager fileManager;
    private final SystemInfoService systemInfoService;
    private final ExecutorService threadPool;
    private final AtomicInteger activeClientsCount = new AtomicInteger(0);

    private ServerSocket serverSocket;
    private volatile boolean isRunning = true;

    public ServerMain(ServerConfig config) {
        this.config = config;
        this.logger = new ServerLogger(config.getLogFile());
        this.authService = new AuthService();
        this.lockManager = new FileLockManager();
        this.fileManager = new FileManager(config.getStorageDir(), lockManager, logger);
        this.systemInfoService = new SystemInfoService(activeClientsCount::get);
        this.threadPool = Executors.newFixedThreadPool(config.getThreadPoolSize());
    }

    public void start() {
        logger.info("Initializing Multi-Client File and System Information Server...");
        logger.info("Shared storage directory: " + fileManager.getStorageRoot());
        logger.info("Thread pool capacity: " + config.getThreadPoolSize() + " workers");

        Runtime.getRuntime().addShutdownHook(new Thread(this::stop, "Server-Shutdown-Hook"));

        try {
            serverSocket = new ServerSocket(config.getPort());
            logger.info("Server is listening on TCP port " + config.getPort() + " (Waiting for clients...)");

            while (isRunning) {
                try {
                    Socket clientSocket = serverSocket.accept();
                    activeClientsCount.incrementAndGet();

                    ClientHandler handler = new ClientHandler(
                            clientSocket,
                            config,
                            authService,
                            fileManager,
                            systemInfoService,
                            logger,
                            activeClientsCount::decrementAndGet
                    );

                    threadPool.submit(handler);
                } catch (IOException e) {
                    if (!isRunning) {
                        break; // Server socket closed during shutdown
                    }
                    logger.error("Error accepting incoming client connection: " + e.getMessage());
                }
            }
        } catch (IOException e) {
            logger.error("Could not start server on port " + config.getPort() + ": " + e.getMessage());
        } finally {
            stop();
        }
    }

    public void stop() {
        if (!isRunning) {
            return;
        }
        isRunning = false;
        logger.info("Shutting down server...");

        try {
            if (serverSocket != null && !serverSocket.isClosed()) {
                serverSocket.close();
            }
        } catch (IOException e) {
            logger.error("Error closing server socket: " + e.getMessage());
        }

        threadPool.shutdown();
        logger.info("Server terminated successfully.");
    }

    public static void main(String[] args) {
        int port = 8888;
        String storageDir = "server-storage";
        String logFile = "server.log";

        if (args.length > 0) {
            try {
                port = Integer.parseInt(args[0]);
            } catch (NumberFormatException e) {
                System.err.println("Invalid port number specified. Using default 8888.");
            }
        }
        if (args.length > 1) {
            storageDir = args[1];
        }

        ServerConfig config = new ServerConfig(port, storageDir, logFile, 3, 20);
        ServerMain server = new ServerMain(config);
        server.start();
    }
}
