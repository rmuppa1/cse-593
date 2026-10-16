package com.networks.client;

import com.networks.client.ui.ConsoleMenu;
import com.networks.client.ui.InputReader;
import com.networks.common.ProtocolConstants;

import java.io.IOException;

/**
 * Entry point for the client console application.
 */
public class ClientMain {

    public static void main(String[] args) {
        InputReader reader = new InputReader();

        System.out.println("==================================================");
        System.out.println("  MULTI-CLIENT FILE & SYSTEM INFORMATION CLIENT   ");
        System.out.println("==================================================");

        String host = ProtocolConstants.DEFAULT_HOST;
        int port = ProtocolConstants.DEFAULT_PORT;

        if (args.length >= 2) {
            host = args[0];
            try {
                port = Integer.parseInt(args[1]);
            } catch (NumberFormatException e) {
                System.err.println("Invalid port parameter. Using " + ProtocolConstants.DEFAULT_PORT);
            }
        } else {
            String inputHost = reader.readLine("Enter server host IP (default: " + host + "): ");
            if (inputHost != null && !inputHost.isEmpty()) {
                host = inputHost;
            }

            String inputPort = reader.readLine("Enter server port (default: " + port + "): ");
            if (inputPort != null && !inputPort.isEmpty()) {
                try {
                    port = Integer.parseInt(inputPort);
                } catch (NumberFormatException e) {
                    System.out.println("Invalid port. Falling back to " + port);
                }
            }
        }

        System.out.println("Connecting to " + host + ":" + port + "...");

        try (ClientConnection connection = new ClientConnection(host, port)) {
            connection.connect();
            System.out.println("Connected to server successfully!\n");

            ConsoleMenu menu = new ConsoleMenu(connection, reader);
            boolean authenticated = menu.performLogin();

            if (authenticated) {
                menu.runMenuLoop();
            } else {
                System.out.println("Terminating client application.");
            }

        } catch (IOException e) {
            System.err.println("Could not connect to server at " + host + ":" + port + " - " + e.getMessage());
        }
    }
}
