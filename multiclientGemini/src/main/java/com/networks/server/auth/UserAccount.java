package com.networks.server.auth;

import java.util.Objects;

/**
 * Represents a registered user account on the server.
 */
public class UserAccount {
    private final String username;
    private final String password;
    private final String role;

    public UserAccount(String username, String password, String role) {
        this.username = Objects.requireNonNull(username, "Username cannot be null");
        this.password = Objects.requireNonNull(password, "Password cannot be null");
        this.role = role != null ? role : "USER";
    }

    public String getUsername() {
        return username;
    }

    public boolean verifyPassword(String inputPassword) {
        return this.password.equals(inputPassword);
    }

    public String getRole() {
        return role;
    }

    @Override
    public String toString() {
        return "UserAccount{" + "username='" + username + '\'' + ", role='" + role + '\'' + '}';
    }
}
