package com.networks.common;

import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Protocol constants and wire helpers shared by client and server.
 *
 * Wire format: every text message is a 4-byte length followed by UTF-8 bytes.
 * A server response is: status (text), message (text), and for a successful
 * DOWNLOAD additionally a long size followed by that many raw bytes.
 */
public final class ProtocolConstants {
    public static final String LOGIN = "LOGIN";
    public static final String LIST = "LIST";
    public static final String UPLOAD = "UPLOAD";
    public static final String DOWNLOAD = "DOWNLOAD";
    public static final String DELETE = "DELETE";
    public static final String INFO = "INFO";
    public static final String TIME = "TIME";
    public static final String UPTIME = "UPTIME";
    public static final String MEMORY = "MEMORY";
    public static final String CLIENTS = "CLIENTS";
    public static final String THREADS = "THREADS";
    public static final String EXIT = "EXIT";

    public static final int DEFAULT_PORT = 5000;
    public static final int BUFFER_SIZE = 8192;
    public static final long MAX_FILE_SIZE = 200L * 1024 * 1024;
    private static final int MAX_TEXT_BYTES = 10 * 1024 * 1024;

    private ProtocolConstants() {
    }

    public static void writeText(DataOutputStream out, String text) throws IOException {
        byte[] b = text.getBytes(StandardCharsets.UTF_8);
        out.writeInt(b.length);
        out.write(b);
    }

    public static String readText(DataInputStream in) throws IOException {
        int len = in.readInt();
        if (len < 0 || len > MAX_TEXT_BYTES) {
            throw new IOException("Invalid message length: " + len);
        }
        byte[] b = new byte[len];
        in.readFully(b);
        return new String(b, StandardCharsets.UTF_8);
    }

    public static void writeResponse(DataOutputStream out, ResponseStatus status, String message)
            throws IOException {
        writeText(out, status.name());
        writeText(out, message);
        out.flush();
    }
}
