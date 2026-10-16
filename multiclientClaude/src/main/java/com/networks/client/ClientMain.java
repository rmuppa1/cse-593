package com.networks.client;

import com.networks.client.ui.ConsoleMenu;
import com.networks.client.ui.InputReader;
import com.networks.common.ProtocolConstants;

import java.io.IOException;

/** Client entry point. Optional args: {@code ClientMain [host] [port]}; otherwise prompts. */
public class ClientMain {
    public static void main(String[] args) {
        InputReader input = new InputReader();
        String host = args.length > 0 ? args[0] : input.readLine("Server IP [localhost]: ");
        if (host == null) return;
        if (host.isEmpty()) host = "localhost";

        int port = ProtocolConstants.DEFAULT_PORT;
        try {
            if (args.length > 1) {
                port = Integer.parseInt(args[1]);
            } else if (args.length == 0) {
                String ps = input.readLine("Server port [" + port + "]: ");
                if (ps == null) return;
                if (!ps.isEmpty()) port = Integer.parseInt(ps);
            }
        } catch (NumberFormatException e) {
            System.out.println("Invalid port.");
            return;
        }

        try (ClientConnection conn = new ClientConnection(host, port)) {
            System.out.println("Connected to " + host + ":" + port);
            new ConsoleMenu(conn, input).run();
        } catch (IOException e) {
            System.out.println("Could not connect: " + e.getMessage());
        }
    }
}
