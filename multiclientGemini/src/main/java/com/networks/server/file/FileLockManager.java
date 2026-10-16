package com.networks.server.file;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/**
 * Manages per-file read and write locks to ensure thread synchronization:
 * - Allows multiple concurrent readers (DOWNLOAD operations).
 * - Enforces exclusive access for writers (UPLOAD / DELETE operations).
 * - Prevents simultaneous writes to the same file.
 * - Prevents file deletion or writing while another client is downloading it.
 */
public class FileLockManager {

    private final ConcurrentHashMap<String, ReentrantReadWriteLock> fileLocks = new ConcurrentHashMap<>();

    private ReentrantReadWriteLock getLockForFile(String filename) {
        String normalizedKey = filename.toLowerCase().trim();
        return fileLocks.computeIfAbsent(normalizedKey, k -> new ReentrantReadWriteLock(true)); // fair lock
    }

    /**
     * Attempts to acquire a read lock on the specified file.
     *
     * @param filename the file to lock
     * @param timeoutSeconds max wait time
     * @return true if acquired, false otherwise
     */
    public boolean acquireReadLock(String filename, long timeoutSeconds) {
        ReentrantReadWriteLock lock = getLockForFile(filename);
        try {
            return lock.readLock().tryLock(timeoutSeconds, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }

    /**
     * Releases read lock on the specified file.
     */
    public void releaseReadLock(String filename) {
        ReentrantReadWriteLock lock = getLockForFile(filename);
        try {
            lock.readLock().unlock();
        } catch (IllegalMonitorStateException ignored) {
            // In case of double unlock or not held
        }
    }

    /**
     * Attempts to acquire exclusive write lock on the specified file.
     *
     * @param filename the file to lock
     * @param timeoutSeconds max wait time
     * @return true if acquired, false otherwise
     */
    public boolean acquireWriteLock(String filename, long timeoutSeconds) {
        ReentrantReadWriteLock lock = getLockForFile(filename);
        try {
            return lock.writeLock().tryLock(timeoutSeconds, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }

    /**
     * Releases exclusive write lock on the specified file.
     */
    public void releaseWriteLock(String filename) {
        ReentrantReadWriteLock lock = getLockForFile(filename);
        try {
            lock.writeLock().unlock();
        } catch (IllegalMonitorStateException ignored) {
            // In case of double unlock or not held
        }
    }

    /**
     * Check if a file is currently locked by readers or writers.
     */
    public boolean isLocked(String filename) {
        ReentrantReadWriteLock lock = fileLocks.get(filename.toLowerCase().trim());
        if (lock == null) return false;
        return lock.isWriteLocked() || lock.getReadLockCount() > 0;
    }
}
