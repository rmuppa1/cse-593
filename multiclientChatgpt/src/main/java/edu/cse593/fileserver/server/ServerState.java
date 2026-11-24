package edu.cse593.fileserver.server;

import java.lang.management.ManagementFactory;
import java.time.Duration;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/** Thread-safe state shared by all connected client handlers. */
final class ServerState {
    private final AtomicInteger activeClients = new AtomicInteger();
    private final Set<String> authenticatedUsers = ConcurrentHashMap.newKeySet();

    void connected() { activeClients.incrementAndGet(); }
    void disconnected() { activeClients.decrementAndGet(); }
    int activeClientCount() { return activeClients.get(); }
    void authenticated(String connectionUser) { authenticatedUsers.add(connectionUser); }
    void unauthenticated(String connectionUser) { authenticatedUsers.remove(connectionUser); }
    int authenticatedClientCount() { return authenticatedUsers.size(); }

    String uptime() {
        Duration duration = Duration.ofMillis(ManagementFactory.getRuntimeMXBean().getUptime());
        return "%d days, %02d:%02d:%02d".formatted(duration.toDays(), duration.toHoursPart(),
                duration.toMinutesPart(), duration.toSecondsPart());
    }
}
