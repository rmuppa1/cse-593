package edu.cse593.fileserver.server;

import java.util.Map;

/** In-memory accounts for this educational application. */
final class AuthService {
    private final Map<String, String> accounts = Map.of(
            "admin", "admin123",
            "alice", "alice123",
            "bob", "bob123"
    );

    boolean authenticate(String username, String password) {
        String expected = accounts.get(username);
        return expected != null && expected.equals(password);
    }
}
