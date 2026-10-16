package com.networks.server.auth;

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
