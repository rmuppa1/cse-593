package edu.cse593.fileserver.server;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.logging.FileHandler;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.logging.SimpleFormatter;

/** Accepts TCP connections and dispatches each one to a worker thread. */
public final class FileServer implements AutoCloseable {
    private static final Logger LOGGER = Logger.getLogger("MultiClientFileServer");

    private final int port;
    private final ExecutorService executor;
    private final AuthService authService = new AuthService();
    private final ServerState state = new ServerState();
    private final FileService fileService;
    private volatile boolean running;
    private ServerSocket serverSocket;

    public FileServer(int port, Path sharedDirectory, int maxWorkers, Path logDirectory) throws IOException {
        if (port < 1 || port > 65535) throw new IllegalArgumentException("Port must be 1-65535");
        if (maxWorkers < 5) throw new IllegalArgumentException("Worker count must be at least 5");
        this.port = port;
        this.executor = Executors.newFixedThreadPool(maxWorkers);
        configureLogging(logDirectory);
        this.fileService = new FileService(sharedDirectory, LOGGER);
    }

    public void start() throws IOException {
        serverSocket = new ServerSocket(port);
        running = true;
        LOGGER.info("Server started port=" + port + " sharedDirectory=" + fileService.sharedDirectory());
        System.out.println("Server listening on port " + port);
        System.out.println("Shared directory: " + fileService.sharedDirectory());
        while (running) {
            try {
                Socket socket = serverSocket.accept();
                socket.setKeepAlive(true);
                executor.execute(new ClientHandler(socket, authService, fileService, state, LOGGER));
            } catch (IOException e) {
                if (running) throw e;
            }
        }
    }

    @Override
    public void close() throws IOException {
        running = false;
        if (serverSocket != null) serverSocket.close();
        executor.shutdownNow();
        LOGGER.info("Server stopped");
    }

    private static synchronized void configureLogging(Path logDirectory) throws IOException {
        Files.createDirectories(logDirectory);
        LOGGER.setLevel(Level.INFO);
        LOGGER.setUseParentHandlers(true);
        if (LOGGER.getHandlers().length == 0) {
            FileHandler handler = new FileHandler(logDirectory.resolve("server-%g.log").toString(),
                    5_000_000, 5, true);
            handler.setFormatter(new SimpleFormatter());
            LOGGER.addHandler(handler);
        }
    }
}
