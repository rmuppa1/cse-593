package com.networks.server.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Validates credentials against predefined accounts. The failed-attempt counter
 * is kept per connection by ClientHandler, which disconnects after the limit.
 */
public class AuthService {
    private final Map<String, UserAccount> accounts = new ConcurrentHashMap<>();

    public AuthService() {
        addAccount("admin", "admin123");
        addAccount("alice", "alice123");
        addAccount("bob", "bob123");
    }

    private void addAccount(String user, String password) {
        accounts.put(user, new UserAccount(user, hash(password)));
    }

    /** Returns true if the username/password pair is valid. */
    public boolean authenticate(String username, String password) {
        UserAccount acct = accounts.get(username);
        if (acct == null || password == null) {
            return false;
        }
        return MessageDigest.isEqual(acct.getPasswordHash().getBytes(StandardCharsets.UTF_8),
                hash(password).getBytes(StandardCharsets.UTF_8));
    }

    private static String hash(String s) {
        try {
            byte[] d = MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : d) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
