package edu.cse593.fileserver;

import edu.cse593.fileserver.client.ConsoleClient;

import java.util.Scanner;

/** Client process entry point. */
public final class ClientMain {
    private ClientMain() { }

    public static void main(String[] args) {
        String host = args.length > 0 ? args[0] : "localhost";
        int port = args.length > 1 ? Integer.parseInt(args[1]) : 5050;
        try (Scanner console = new Scanner(System.in);
             ConsoleClient client = new ConsoleClient(host, port, console)) {
            client.run();
        } catch (Exception e) {
            System.err.println("Client failed: " + e.getMessage());
            System.exit(1);
        }
    }
}
