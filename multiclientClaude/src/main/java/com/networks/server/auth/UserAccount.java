package com.networks.server.auth;

/** A user account; only the SHA-256 hash of the password is retained. */
public class UserAccount {
    private final String username;
    private final String passwordHash;

    public UserAccount(String username, String passwordHash) {
        this.username = username;
        this.passwordHash = passwordHash;
    }

    public String getUsername() { return username; }
    public String getPasswordHash() { return passwordHash; }
}
