package com.networks.server.system;

import java.lang.management.ManagementFactory;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.function.IntSupplier;

public class SystemInfoService {
    private final Instant startTime;
    private final IntSupplier clientCount;

    public SystemInfoService(Instant startTime, IntSupplier clientCount) {
        this.startTime = startTime;
        this.clientCount = clientCount;
    }

    public String time() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    public String uptime() {
        Duration d = Duration.between(startTime, Instant.now());
        return String.format("%dd %02dh %02dm %02ds", d.toDays(), d.toHoursPart(), d.toMinutesPart(), d.toSecondsPart());
    }

    public String memory() {
        Runtime rt = Runtime.getRuntime();
        long mb = 1024 * 1024;
        return String.format("Total: %d MB, Free: %d MB, Used: %d MB, Max: %d MB",
                rt.totalMemory() / mb, rt.freeMemory() / mb, (rt.totalMemory() - rt.freeMemory()) / mb, rt.maxMemory() / mb);
    }

    public String clients() {
        return "Connected clients: " + clientCount.getAsInt();
    }

    public String threads() {
        var bean = ManagementFactory.getThreadMXBean();
        return "Live threads: " + bean.getThreadCount() + ", Peak: " + bean.getPeakThreadCount()
                + ", Active in group: " + Thread.activeCount();
    }
}
