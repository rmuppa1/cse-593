package com.networks.server.file;

import com.networks.common.ProtocolConstants;
import com.networks.common.ResponseStatus;

import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.locks.Lock;
import java.util.stream.Stream;

/** File operations confined to the storage directory, guarded by {@link FileLockManager}. */
public class FileManager {

    /** Outcome of an operation: status, message, and bytes transferred (for logging). */
    public static class Result {
        public final ResponseStatus status;
        public final String message;
        public final long bytes;

        Result(ResponseStatus status, String message, long bytes) {
            this.status = status;
            this.message = message;
            this.bytes = bytes;
        }
    }

    private final Path root;
    private final FileLockManager locks;

    public FileManager(Path root, FileLockManager locks) throws IOException {
        this.root = root.toAbsolutePath().normalize();
        this.locks = locks;
        Files.createDirectories(this.root);
    }

    /** Resolves a client-supplied filename inside the root; returns null if unsafe. */
    private Path resolve(String name) {
        if (name == null || name.isEmpty() || name.startsWith(".") || name.length() > 255
                || name.contains("/") || name.contains("\\") || name.indexOf('\0') >= 0) {
            return null;
        }
        Path p;
        try {
            p = root.resolve(name).normalize();
        } catch (RuntimeException e) {
            return null;
        }
        if (!p.startsWith(root) || !root.equals(p.getParent())) {
            return null;
        }
        return p;
    }

    private static Result bad(String name) {
        return new Result(ResponseStatus.ERROR, "Invalid filename: " + name, 0);
    }

    public Result list() {
        List<String> lines = new ArrayList<>();
        try (Stream<Path> s = Files.list(root)) {
            s.filter(p -> Files.isRegularFile(p) && !p.getFileName().toString().startsWith("."))
                    .forEach(p -> {
                        try {
                            lines.add(p.getFileName() + "  (" + Files.size(p) + " bytes)");
                        } catch (IOException ignored) {
                            // file vanished between listing and sizing
                        }
                    });
        } catch (IOException e) {
            return new Result(ResponseStatus.ERROR, "Cannot list files: " + e.getMessage(), 0);
        }
        Collections.sort(lines);
        String msg = lines.isEmpty() ? "(no files)" : String.join("\n", lines);
        return new Result(ResponseStatus.SUCCESS, msg, 0);
    }

    public Result info(String name) {
        Path p = resolve(name);
        if (p == null) return bad(name);
        try {
            BasicFileAttributes a = Files.readAttributes(p, BasicFileAttributes.class);
            if (!a.isRegularFile()) return new Result(ResponseStatus.NOT_FOUND, "File not found: " + name, 0);
            DateTimeFormatter f = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.systemDefault());
            String msg = "Name: " + name + "\nSize: " + a.size() + " bytes\nCreated: " +
                    f.format(a.creationTime().toInstant()) + "\nModified: " + f.format(a.lastModifiedTime().toInstant());
            return new Result(ResponseStatus.SUCCESS, msg, 0);
        } catch (IOException e) {
            return new Result(ResponseStatus.NOT_FOUND, "File not found: " + name, 0);
        }
    }

    public Result delete(String name) {
        Path p = resolve(name);
        if (p == null) return bad(name);
        Lock lock;
        try {
            lock = locks.acquireWrite(name);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return new Result(ResponseStatus.ERROR, "Interrupted", 0);
        }
        if (lock == null) return new Result(ResponseStatus.LOCKED, "File is in use: " + name, 0);
        try {
            if (!Files.isRegularFile(p)) return new Result(ResponseStatus.NOT_FOUND, "File not found: " + name, 0);
            long size = Files.size(p);
            Files.delete(p);
            return new Result(ResponseStatus.SUCCESS, "Deleted " + name, size);
        } catch (IOException e) {
            return new Result(ResponseStatus.ERROR, "Delete failed: " + e.getMessage(), 0);
        } finally {
            lock.unlock();
        }
    }

    /**
     * Handles an UPLOAD whose header has been parsed. Replies READY (or an error) to the
     * client, receives exactly {@code size} bytes into a temp file, then atomically moves it
     * into place under the file's write lock. Throws IOException on connection failure.
     */
    public Result upload(String name, long size, DataInputStream in, DataOutputStream out) throws IOException {
        Path target = resolve(name);
        if (target == null) {
            Result r = bad(name);
            ProtocolConstants.writeResponse(out, r.status, r.message);
            return r;
        }
        if (size < 0 || size > ProtocolConstants.MAX_FILE_SIZE) {
            Result r = new Result(ResponseStatus.ERROR, "Invalid or too large file size: " + size, 0);
            ProtocolConstants.writeResponse(out, r.status, r.message);
            return r;
        }
        Path tmp = Files.createTempFile(root, ".upload-", ".tmp");
        try {
            ProtocolConstants.writeResponse(out, ResponseStatus.SUCCESS, "READY");
            // Receive all bytes first so the stream stays in sync even if we then reject the file.
            try (OutputStream fo = Files.newOutputStream(tmp)) {
                byte[] buf = new byte[ProtocolConstants.BUFFER_SIZE];
                long remaining = size;
                while (remaining > 0) {
                    int n = in.read(buf, 0, (int) Math.min(buf.length, remaining));
                    if (n < 0) throw new IOException("Connection closed during upload");
                    fo.write(buf, 0, n);
                    remaining -= n;
                }
            }
            Lock lock;
            try {
                lock = locks.acquireWrite(name);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                lock = null;
            }
            Result r;
            if (lock == null) {
                r = new Result(ResponseStatus.LOCKED, "File is in use, try again later: " + name, 0);
            } else {
                try {
                    Files.move(tmp, target, StandardCopyOption.REPLACE_EXISTING);
                    r = new Result(ResponseStatus.SUCCESS, "Uploaded " + name + " (" + size + " bytes)", size);
                } catch (IOException e) {
                    r = new Result(ResponseStatus.ERROR, "Upload failed: " + e.getMessage(), 0);
                } finally {
                    lock.unlock();
                }
            }
            ProtocolConstants.writeResponse(out, r.status, r.message);
            return r;
        } finally {
            Files.deleteIfExists(tmp);
        }
    }

    /**
     * Handles a DOWNLOAD: writes the response and, on success, the size and bytes, all while
     * holding the file's read lock. Throws IOException on connection failure.
     */
    public Result download(String name, DataOutputStream out) throws IOException {
        Path p = resolve(name);
        if (p == null) {
            Result r = bad(name);
            ProtocolConstants.writeResponse(out, r.status, r.message);
            return r;
        }
        Lock lock;
        try {
            lock = locks.acquireRead(name);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            lock = null;
        }
        if (lock == null) {
            Result r = new Result(ResponseStatus.LOCKED, "File is being modified: " + name, 0);
            ProtocolConstants.writeResponse(out, r.status, r.message);
            return r;
        }
        try {
            if (!Files.isRegularFile(p)) {
                Result r = new Result(ResponseStatus.NOT_FOUND, "File not found: " + name, 0);
                ProtocolConstants.writeResponse(out, r.status, r.message);
                return r;
            }
            long size = Files.size(p);
            ProtocolConstants.writeResponse(out, ResponseStatus.SUCCESS, name);
            out.writeLong(size);
            try (InputStream fi = Files.newInputStream(p)) {
                byte[] buf = new byte[ProtocolConstants.BUFFER_SIZE];
                long remaining = size;
                while (remaining > 0) {
                    int n = fi.read(buf, 0, (int) Math.min(buf.length, remaining));
                    if (n < 0) throw new IOException("File shrank during download");
                    out.write(buf, 0, n);
                    remaining -= n;
                }
            }
            out.flush();
            return new Result(ResponseStatus.SUCCESS, "Sent " + name, size);
        } finally {
            lock.unlock();
        }
    }
}
