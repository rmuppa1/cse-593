package com.networks.client.ui;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

/** Console input helper that reports EOF instead of crashing. */
public class InputReader {
    private final BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));

    /** Prints a prompt and returns the trimmed line, or null on EOF / read error. */
    public String readLine(String prompt) {
        System.out.print(prompt);
        System.out.flush();
        try {
            String line = reader.readLine();
            return line == null ? null : line.trim();
        } catch (IOException e) {
            return null;
        }
    }
}
