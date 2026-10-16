package com.networks.client.ui;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class InputReader {
    private final BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));

    /** Prompts and returns the trimmed line; throws on EOF so callers can exit cleanly. */
    public String readLine(String prompt) {
        System.out.print(prompt);
        System.out.flush();
        try {
            String line = reader.readLine();
            if (line == null) throw new IllegalStateException("End of input");
            return line.trim();
        } catch (IOException e) {
            throw new IllegalStateException("Input error", e);
        }
    }
}
