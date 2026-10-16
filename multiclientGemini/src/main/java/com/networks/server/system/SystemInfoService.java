package com.networks.server.system;

import java.lang.management.ManagementFactory;
import java.lang.management.ThreadMXBean;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.function.IntSupplier;

/**
 * Service providing server diagnostic information:
 * - Current server time (TIME)
 * - Server uptime since startup (UPTIME)
 * - JVM memory statistics: free, total, and max (MEMORY)
 * - Number of active connected clients (CLIENTS)
 * - Live threads running on the server JVM (THREADS)
 */
public class SystemInfoService {

    private final Instant startTime;
    private final IntSupplier activeClientsSupplier;
    private static final DateTimeFormatter TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss z").withZone(ZoneId.systemDefault());

    public SystemInfoService(IntSupplier activeClientsSupplier) {
        this.startTime = Instant.now();
        this.activeClientsSupplier = activeClientsSupplier;
    }

    /**
     * TIME: Current date and time on server with timezone.
     */
    public String getServerTime() {
        return TIME_FORMATTER.format(Instant.now());
    }

    /**
     * UPTIME: Duration server has been running.
     */
    public String getUptime() {
        Duration duration = Duration.between(startTime, Instant.now());
        long days = duration.toDays();
        long hours = duration.toHoursPart();
        long minutes = duration.toMinutesPart();
        long seconds = duration.toSecondsPart();

        return String.format("%d days, %02d hours, %02d minutes, %02d seconds",
                days, hours, minutes, seconds);
    }

    /**
     * MEMORY: Current JVM memory utilization (Free / Total / Max).
     */
    public String getMemoryInfo() {
        Runtime runtime = Runtime.getRuntime();
        long freeMem = runtime.freeMemory() / (1024 * 1024);
        long totalMem = runtime.totalMemory() / (1024 * 1024);
        long maxMem = runtime.maxMemory() / (1024 * 1024);
        long usedMem = totalMem - freeMem;

        return String.format("Used: %d MB | Free: %d MB | Total Allocated: %d MB | Max Available: %d MB",
                usedMem, freeMem, totalMem, maxMem);
    }

    /**
     * CLIENTS: Total number of active TCP client connections.
     */
    public String getActiveClientsCount() {
        int count = activeClientsSupplier.getAsInt();
        return String.format("%d active client%s connected", count, count == 1 ? "" : "s");
    }

    /**
     * THREADS: Total JVM active thread count and daemon thread count.
     */
    public String getThreadInfo() {
        ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();
        int activeCount = threadBean.getThreadCount();
        int peakCount = threadBean.getPeakThreadCount();
        int daemonCount = threadBean.getDaemonThreadCount();

        return String.format("Active Threads: %d (Peak: %d, Daemon: %d)",
                activeCount, peakCount, daemonCount);
    }
}
