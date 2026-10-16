package com.networks.server.file;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

public class FileLockManager {
    private final ConcurrentHashMap<String, ReentrantReadWriteLock> locks = new ConcurrentHashMap<>();

    private ReentrantReadWriteLock lockFor(String name) {
        return locks.computeIfAbsent(name, k -> new ReentrantReadWriteLock(true));
    }

    /** Non-blocking read lock (downloads). Returns null if a writer holds the file. */
    public Lock tryReadLock(String name) {
        Lock l = lockFor(name).readLock();
        return l.tryLock() ? l : null;
    }

    /** Non-blocking write lock (upload/delete). Returns null if the file is in use. */
    public Lock tryWriteLock(String name) {
        Lock l = lockFor(name).writeLock();
        return l.tryLock() ? l : null;
    }
}
