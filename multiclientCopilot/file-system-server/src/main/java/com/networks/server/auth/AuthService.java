package com.networks.server.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class AuthService {
    private final Map<String, UserAccount> accounts = new ConcurrentHashMap<>();

    public AuthService() {
        add("admin", "admin123");
        add("alice", "alice123");
        add("bob", "bob123");
    }

    private void add(String user, String password) {
        accounts.put(user, new UserAccount(user, hash(password)));
    }

    /** Returns true if credentials are valid. Failure counting is per connection in ClientHandler. */
    public boolean authenticate(String username, String password) {
        UserAccount acc = accounts.get(username);
        String h = hash(password == null ? "" : password);
        if (acc == null) return false;
        return MessageDigest.isEqual(
                acc.getPasswordHash().getBytes(StandardCharsets.UTF_8), h.getBytes(StandardCharsets.UTF_8));
    }

    private static String hash(String s) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
