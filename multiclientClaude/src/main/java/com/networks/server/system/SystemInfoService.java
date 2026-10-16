package com.networks.server.system;

import java.lang.management.ManagementFactory;
import java.lang.management.ThreadMXBean;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.function.IntSupplier;

/** Provides server runtime information for the system-info commands. */
public class SystemInfoService {
    private final long startMillis;
    private final IntSupplier clientCount;

    public SystemInfoService(long startMillis, IntSupplier clientCount) {
        this.startMillis = startMillis;
        this.clientCount = clientCount;
    }

    public String time() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    public String uptime() {
        Duration d = Duration.ofMillis(System.currentTimeMillis() - startMillis);
        return String.format("%d days, %02d:%02d:%02d", d.toDays(), d.toHours() % 24, d.toMinutes() % 60,
                d.getSeconds() % 60);
    }

    public String memory() {
        Runtime r = Runtime.getRuntime();
        long mb = 1024 * 1024;
        return "Total: " + r.totalMemory() / mb + " MB\nFree: " + r.freeMemory() / mb +
                " MB\nUsed: " + (r.totalMemory() - r.freeMemory()) / mb + " MB\nMax: " + r.maxMemory() / mb + " MB";
    }

    public String clients() {
        return "Connected clients: " + clientCount.getAsInt();
    }

    public String threads() {
        ThreadMXBean mx = ManagementFactory.getThreadMXBean();
        return "Live threads (JVM): " + mx.getThreadCount() + "\nPeak threads: " + mx.getPeakThreadCount() +
                "\nActive in main group: " + Thread.activeCount();
    }
}
