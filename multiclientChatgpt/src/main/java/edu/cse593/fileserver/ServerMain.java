package edu.cse593.fileserver;

import edu.cse593.fileserver.server.FileServer;

import java.nio.file.Path;

/** Server process entry point. */
public final class ServerMain {
    private ServerMain() { }

    public static void main(String[] args) {
        int port = args.length > 0 ? Integer.parseInt(args[0]) : 5050;
        Path shared = Path.of(args.length > 1 ? args[1] : "shared");
        int workers = args.length > 2 ? Integer.parseInt(args[2]) : 20;
        Path logs = Path.of(args.length > 3 ? args[3] : "logs");

        try (FileServer server = new FileServer(port, shared, workers, logs)) {
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                try { server.close(); } catch (Exception ignored) { }
            }, "server-shutdown"));
            server.start();
        } catch (Exception e) {
            System.err.println("Server failed: " + e.getMessage());
            e.printStackTrace(System.err);
            System.exit(1);
        }
    }
}
