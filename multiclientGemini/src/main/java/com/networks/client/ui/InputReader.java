package com.networks.client.ui;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

/**
 * Standard console input reader with defensive null checks and trimming.
 */
public class InputReader {

    private final BufferedReader reader;

    public InputReader() {
        this.reader = new BufferedReader(new InputStreamReader(System.in));
    }

    public String readLine(String prompt) {
        System.out.print(prompt);
        System.out.flush();
        try {
            String line = reader.readLine();
            return line != null ? line.trim() : null;
        } catch (IOException e) {
            return null;
        }
    }

    public int readInt(String prompt, int min, int max) {
        while (true) {
            String input = readLine(prompt);
            if (input == null) {
                return -1;
            }
            try {
                int value = Integer.parseInt(input);
                if (value >= min && value <= max) {
                    return value;
                }
                System.out.println("Please enter a number between " + min + " and " + max + ".");
            } catch (NumberFormatException e) {
                System.out.println("Invalid numeric input. Please try again.");
            }
        }
    }
}
