package com.networks.server.file;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/**
 * Per-filename read/write locks. Downloads take the read lock (many concurrent
 * readers); uploads (overwrite) and deletes take the write lock (exclusive), so
 * a file can neither be written twice at once nor deleted while being downloaded.
 */
public class FileLockManager {
    private static final long WAIT_MS = 3000;
    private final ConcurrentHashMap<String, ReentrantReadWriteLock> locks = new ConcurrentHashMap<>();

    private ReentrantReadWriteLock lockFor(String name) {
        return locks.computeIfAbsent(name, k -> new ReentrantReadWriteLock(true));
    }

    /** Try to acquire a read lock; returns the lock to unlock later, or null if it timed out. */
    public Lock acquireRead(String name) throws InterruptedException {
        Lock l = lockFor(name).readLock();
        return l.tryLock(WAIT_MS, TimeUnit.MILLISECONDS) ? l : null;
    }

    /** Try to acquire the exclusive write lock; returns the lock or null if it timed out. */
    public Lock acquireWrite(String name) throws InterruptedException {
        Lock l = lockFor(name).writeLock();
        return l.tryLock(WAIT_MS, TimeUnit.MILLISECONDS) ? l : null;
    }
}
