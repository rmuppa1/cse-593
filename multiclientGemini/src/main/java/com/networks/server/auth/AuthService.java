package com.networks.server.auth;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service managing user credentials, predefined accounts,
 * and authentication attempts per client session.
 */
public class AuthService {
    private final Map<String, UserAccount> userDatabase = new ConcurrentHashMap<>();

    public AuthService() {
        initDefaultAccounts();
    }

    /**
     * Initializes at least 3 predefined accounts as required.
     */
    private void initDefaultAccounts() {
        registerUser(new UserAccount("admin", "admin123", "ADMIN"));
        registerUser(new UserAccount("alice", "alicePass!", "USER"));
        registerUser(new UserAccount("bob", "bobSecret#9", "USER"));
        registerUser(new UserAccount("guest", "guest2025", "USER"));
    }

    public void registerUser(UserAccount account) {
        userDatabase.put(account.getUsername().toLowerCase(), account);
    }

    /**
     * Validates credentials against the stored database.
     *
     * @param username username provided
     * @param password password provided
     * @return UserAccount if authentication succeeds, null otherwise.
     */
    public UserAccount authenticate(String username, String password) {
        if (username == null || password == null) {
            return null;
        }
        UserAccount account = userDatabase.get(username.trim().toLowerCase());
        if (account != null && account.verifyPassword(password)) {
            return account;
        }
        return null;
    }

    public boolean userExists(String username) {
        if (username == null) return false;
        return userDatabase.containsKey(username.trim().toLowerCase());
    }
}
