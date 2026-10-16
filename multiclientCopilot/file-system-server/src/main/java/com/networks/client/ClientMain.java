package com.networks.client;

import com.networks.client.ui.ConsoleMenu;
import com.networks.client.ui.InputReader;
import com.networks.common.ProtocolConstants;

public class ClientMain {
    public static void main(String[] args) {
        InputReader input = new InputReader();
        try {
            String host = input.readLine("Server IP [localhost]: ");
            if (host.isEmpty()) host = "localhost";
            String ps = input.readLine("Server port [" + ProtocolConstants.DEFAULT_PORT + "]: ");
            int port = ps.isEmpty() ? ProtocolConstants.DEFAULT_PORT : Integer.parseInt(ps);
            try (ClientConnection conn = new ClientConnection(host, port)) {
                ConsoleMenu menu = new ConsoleMenu(conn, input);
                if (menu.authenticate()) menu.run();
            }
        } catch (NumberFormatException e) {
            System.err.println("Invalid port.");
        } catch (IllegalStateException e) {
            System.out.println("\nInput closed. Exiting.");
        } catch (java.io.IOException e) {
            System.err.println("Connection error: " + e.getMessage());
        }
    }
}
