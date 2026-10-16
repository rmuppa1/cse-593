package com.networks.server.file;

import com.networks.common.ProtocolConstants;
import com.networks.common.ResponseStatus;

import java.io.*;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.List;
import java.util.concurrent.locks.Lock;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class FileManager {
    public record Result(ResponseStatus status, String message) {}

    private final Path root;
    private final FileLockManager locks = new FileLockManager();
    private final long maxUpload;

    public FileManager(Path storageDir, long maxUpload) throws IOException {
        Files.createDirectories(storageDir);
        this.root = storageDir.toRealPath();
        this.maxUpload = maxUpload;
    }

    /** Resolves a plain filename inside the storage root; null if invalid or escaping. */
    private Path resolve(String name) {
        if (name == null || name.isBlank() || name.contains("/") || name.contains("\\")
                || name.contains("\0") || name.startsWith(".")) return null;
        try {
            Path p = root.resolve(name).normalize();
            if (!p.startsWith(root) || !root.equals(p.getParent())) return null;
            return p;
        } catch (InvalidPathException e) {
            return null;
        }
    }

    public Result list() throws IOException {
        try (Stream<Path> s = Files.list(root)) {
            List<String> names = s.filter(Files::isRegularFile)
                    .filter(p -> !p.getFileName().toString().startsWith("."))
                    .map(p -> {
                        try { return p.getFileName() + " (" + Files.size(p) + " bytes)"; }
                        catch (IOException e) { return p.getFileName().toString(); }
                    }).sorted().collect(Collectors.toList());
            return new Result(ResponseStatus.SUCCESS, names.isEmpty() ? "(no files)" : String.join("\n", names));
        }
    }

    public Result info(String name) throws IOException {
        Path p = resolve(name);
        if (p == null) return new Result(ResponseStatus.ERROR, "Invalid filename");
        if (!Files.isRegularFile(p)) return new Result(ResponseStatus.NOT_FOUND, "File not found: " + name);
        BasicFileAttributes a = Files.readAttributes(p, BasicFileAttributes.class);
        return new Result(ResponseStatus.SUCCESS, "Name: " + name + "\nSize: " + a.size()
                + " bytes\nCreated: " + a.creationTime() + "\nModified: " + a.lastModifiedTime());
    }

    public Result delete(String name) throws IOException {
        Path p = resolve(name);
        if (p == null) return new Result(ResponseStatus.ERROR, "Invalid filename");
        Lock l = locks.tryWriteLock(name);
        if (l == null) return new Result(ResponseStatus.LOCKED, "File is in use: " + name);
        try {
            if (!Files.isRegularFile(p)) return new Result(ResponseStatus.NOT_FOUND, "File not found: " + name);
            Files.delete(p);
            return new Result(ResponseStatus.SUCCESS, "Deleted " + name);
        } finally {
            l.unlock();
        }
    }

    /** Handle for a locked, in-progress transfer. Must be closed to release the lock. */
    public static class Transfer implements Closeable {
        private final Lock lock;
        public final Path path;
        Transfer(Lock lock, Path path) { this.lock = lock; this.path = path; }
        @Override public void close() { lock.unlock(); }
    }

    /** Either a failure Result or a locked Transfer. */
    public record Begin(Result failure, Transfer transfer) {}

    public Begin beginDownload(String name) {
        Path p = resolve(name);
        if (p == null) return new Begin(new Result(ResponseStatus.ERROR, "Invalid filename"), null);
        Lock l = locks.tryReadLock(name);
        if (l == null) return new Begin(new Result(ResponseStatus.LOCKED, "File is being written: " + name), null);
        if (!Files.isRegularFile(p)) {
            l.unlock();
            return new Begin(new Result(ResponseStatus.NOT_FOUND, "File not found: " + name), null);
        }
        return new Begin(null, new Transfer(l, p));
    }

    public Begin beginUpload(String name, long size) {
        Path p = resolve(name);
        if (p == null) return new Begin(new Result(ResponseStatus.ERROR, "Invalid filename"), null);
        if (size < 0 || size > maxUpload) return new Begin(new Result(ResponseStatus.ERROR, "Invalid file size"), null);
        Lock l = locks.tryWriteLock(name);
        if (l == null) return new Begin(new Result(ResponseStatus.LOCKED, "File is in use: " + name), null);
        return new Begin(null, new Transfer(l, p));
    }

    /** Streams the file to the client (caller holds the read lock). */
    public long sendFile(Transfer t, DataOutputStream out) throws IOException {
        long size = Files.size(t.path);
        out.writeLong(size);
        byte[] buf = new byte[ProtocolConstants.BUFFER_SIZE];
        long remaining = size;
        try (InputStream in = Files.newInputStream(t.path)) {
            while (remaining > 0) {
                int n = in.read(buf, 0, (int) Math.min(buf.length, remaining));
                if (n < 0) throw new EOFException("File shrank during download");
                out.write(buf, 0, n);
                remaining -= n;
            }
        }
        out.flush();
        return size;
    }

    /** Receives exactly size bytes into a temp file, then atomically replaces the target. */
    public void receiveFile(Transfer t, DataInputStream in, long size) throws IOException {
        Path tmp = Files.createTempFile(root, ".upload-", ".tmp");
        try {
            byte[] buf = new byte[ProtocolConstants.BUFFER_SIZE];
            long remaining = size;
            try (OutputStream out = Files.newOutputStream(tmp)) {
                while (remaining > 0) {
                    int n = in.read(buf, 0, (int) Math.min(buf.length, remaining));
                    if (n < 0) throw new EOFException("Connection closed during upload");
                    out.write(buf, 0, n);
                    remaining -= n;
                }
            }
            Files.move(tmp, t.path, StandardCopyOption.REPLACE_EXISTING);
        } finally {
            Files.deleteIfExists(tmp);
        }
    }
}
