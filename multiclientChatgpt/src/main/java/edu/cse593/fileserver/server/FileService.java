package edu.cse593.fileserver.server;

import edu.cse593.fileserver.protocol.Protocol;

import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.BasicFileAttributes;
import java.nio.file.LinkOption;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import java.util.logging.Logger;

/** Confines file access to one directory and coordinates per-file readers/writers. */
final class FileService {
    record FileEntry(String name, long size, long modifiedMillis) { }
    record FileInfo(String name, long size, long modifiedMillis, boolean readable, boolean writable) { }

    private final Path sharedDirectory;
    private final ConcurrentHashMap<Path, ReentrantReadWriteLock> locks = new ConcurrentHashMap<>();
    private final Logger logger;

    FileService(Path sharedDirectory, Logger logger) throws IOException {
        this.sharedDirectory = sharedDirectory.toAbsolutePath().normalize();
        this.logger = logger;
        Files.createDirectories(this.sharedDirectory);
        if (!Files.isDirectory(this.sharedDirectory)) {
            throw new IOException("Shared path is not a directory: " + this.sharedDirectory);
        }
    }

    Path sharedDirectory() {
        return sharedDirectory;
    }

    List<FileEntry> list() throws IOException {
        List<FileEntry> entries = new ArrayList<>();
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(sharedDirectory)) {
            for (Path path : stream) {
                if (Files.isRegularFile(path, LinkOption.NOFOLLOW_LINKS)
                        && !path.getFileName().toString().endsWith(".uploading")) {
                    BasicFileAttributes attrs = Files.readAttributes(path, BasicFileAttributes.class);
                    entries.add(new FileEntry(path.getFileName().toString(), attrs.size(),
                            attrs.lastModifiedTime().toMillis()));
                }
            }
        }
        entries.sort(Comparator.comparing(FileEntry::name, String.CASE_INSENSITIVE_ORDER));
        return entries;
    }

    void upload(String requestedName, long size, DataInputStream input) throws IOException {
        if (size < 0) {
            throw new IOException("Invalid file size");
        }
        Path target = resolveSafe(requestedName);
        ReentrantReadWriteLock.WriteLock lock = lockFor(target).writeLock();
        lock.lock();
        Path temporary = sharedDirectory.resolve(target.getFileName() + ".uploading").normalize();
        try {
            try (OutputStream output = Files.newOutputStream(temporary, StandardOpenOption.CREATE,
                    StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE)) {
                copyExactly(input, output, size);
            } catch (IOException e) {
                Files.deleteIfExists(temporary);
                throw e;
            }
            try {
                Files.move(temporary, target, StandardCopyOption.REPLACE_EXISTING,
                        StandardCopyOption.ATOMIC_MOVE);
            } catch (java.nio.file.AtomicMoveNotSupportedException e) {
                Files.move(temporary, target, StandardCopyOption.REPLACE_EXISTING);
            }
            logger.info(() -> "Uploaded file=" + target.getFileName() + " size=" + size);
        } finally {
            lock.unlock();
        }
    }

    long download(String requestedName, DataOutputStream output) throws IOException {
        Path target = resolveSafe(requestedName);
        ReentrantReadWriteLock.ReadLock lock = lockFor(target).readLock();
        lock.lock();
        try {
            requireRegularFile(target);
            long size = Files.size(target);
            output.writeUTF(Protocol.OK);
            output.writeUTF("Download starting");
            output.writeLong(size);
            try (InputStream input = Files.newInputStream(target)) {
                input.transferTo(output);
            }
            output.flush();
            logger.info(() -> "Downloaded file=" + target.getFileName() + " size=" + size);
            return size;
        } finally {
            lock.unlock();
        }
    }

    void delete(String requestedName) throws IOException {
        Path target = resolveSafe(requestedName);
        ReentrantReadWriteLock.WriteLock lock = lockFor(target).writeLock();
        lock.lock();
        try {
            requireRegularFile(target);
            long size = Files.size(target);
            Files.delete(target);
            logger.info(() -> "Deleted file=" + target.getFileName() + " size=" + size);
        } finally {
            lock.unlock();
        }
    }

    FileInfo info(String requestedName) throws IOException {
        Path target = resolveSafe(requestedName);
        ReentrantReadWriteLock.ReadLock lock = lockFor(target).readLock();
        lock.lock();
        try {
            requireRegularFile(target);
            BasicFileAttributes attrs = Files.readAttributes(target, BasicFileAttributes.class);
            return new FileInfo(target.getFileName().toString(), attrs.size(),
                    attrs.lastModifiedTime().toMillis(), Files.isReadable(target), Files.isWritable(target));
        } finally {
            lock.unlock();
        }
    }

    void validateName(String requestedName) throws IOException {
        resolveSafe(requestedName);
    }

    private Path resolveSafe(String requestedName) throws IOException {
        if (requestedName == null || requestedName.isBlank()) {
            throw new IOException("File name cannot be empty");
        }
        Path supplied;
        try {
            supplied = Path.of(requestedName);
        } catch (RuntimeException e) {
            throw new IOException("Invalid file name", e);
        }
        if (supplied.isAbsolute() || supplied.getNameCount() != 1 || requestedName.equals(".")
                || requestedName.equals("..") || requestedName.endsWith(".uploading")) {
            throw new IOException("Only a plain file name inside the shared directory is allowed");
        }
        Path resolved = sharedDirectory.resolve(supplied).normalize();
        if (!resolved.getParent().equals(sharedDirectory)) {
            throw new IOException("Path escapes shared directory");
        }
        return resolved;
    }

    private ReentrantReadWriteLock lockFor(Path target) {
        return locks.computeIfAbsent(target, ignored -> new ReentrantReadWriteLock(true));
    }

    private static void requireRegularFile(Path target) throws IOException {
        if (Files.isSymbolicLink(target)
                || !Files.isRegularFile(target, LinkOption.NOFOLLOW_LINKS)) {
            throw new IOException("File does not exist: " + target.getFileName());
        }
    }

    private static void copyExactly(InputStream input, OutputStream output, long size) throws IOException {
        byte[] buffer = new byte[Protocol.BUFFER_SIZE];
        long remaining = size;
        while (remaining > 0) {
            int read = input.read(buffer, 0, (int) Math.min(buffer.length, remaining));
            if (read < 0) {
                throw new EOFException("Connection ended before the complete file was received");
            }
            output.write(buffer, 0, read);
            remaining -= read;
        }
    }
}
