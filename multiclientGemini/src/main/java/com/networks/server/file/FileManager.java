package com.networks.server.file;

import com.networks.common.ProtocolConstants;
import com.networks.common.ResponseStatus;
import com.networks.server.logging.ServerLogger;

import java.io.*;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Handles all file storage operations:
 * - Sandboxing (all operations strictly bounded to storage root directory).
 * - Directory listing (LIST).
 * - File information metadata (INFO).
 * - Safe atomic file deletion (DELETE).
 * - Reading/writing file streams with synchronization through FileLockManager (UPLOAD, DOWNLOAD).
 */
public class FileManager {

    private final Path storageRoot;
    private final FileLockManager lockManager;
    private final ServerLogger logger;
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.systemDefault());

    public FileManager(String storageDirPath, FileLockManager lockManager, ServerLogger logger) {
        this.storageRoot = Paths.get(storageDirPath).toAbsolutePath().normalize();
        this.lockManager = lockManager;
        this.logger = logger;
        initStorageDirectory();
    }

    private void initStorageDirectory() {
        try {
            if (!Files.exists(storageRoot)) {
                Files.createDirectories(storageRoot);
                logger.info("Created storage root directory: " + storageRoot);
            }
        } catch (IOException e) {
            logger.error("Failed to initialize storage directory: " + e.getMessage());
            throw new RuntimeException("Storage directory initialization failed", e);
        }
    }

    public Path getStorageRoot() {
        return storageRoot;
    }

    /**
     * Resolves a sanitized file path and ensures it stays strictly within the sandboxed storage root.
     * Prevents directory traversal attacks (e.g. "../../etc/passwd").
     */
    private Path resolveSandboxedPath(String filename) throws SecurityException, IllegalArgumentException {
        if (filename == null || filename.trim().isEmpty()) {
            throw new IllegalArgumentException("Filename cannot be empty");
        }

        // Strip any leading slashes or drive letters
        String cleanName = Paths.get(filename).getFileName().toString();
        if (cleanName.contains("..") || cleanName.contains("/") || cleanName.contains("\\")) {
            throw new SecurityException("Directory traversal attempt detected: " + filename);
        }

        Path resolved = storageRoot.resolve(cleanName).normalize();
        if (!resolved.startsWith(storageRoot)) {
            throw new SecurityException("Access denied: File outside sandboxed directory.");
        }
        return resolved;
    }

    /**
     * Lists all regular files in the shared storage directory.
     */
    public List<String> listFiles() throws IOException {
        List<String> fileSummaries = new ArrayList<>();
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(storageRoot)) {
            for (Path entry : stream) {
                if (Files.isRegularFile(entry)) {
                    BasicFileAttributes attrs = Files.readAttributes(entry, BasicFileAttributes.class);
                    String modifiedTime = DATE_FORMATTER.format(attrs.lastModifiedTime().toInstant());
                    fileSummaries.add(String.format("%-25s | %10d bytes | %s",
                            entry.getFileName().toString(),
                            attrs.size(),
                            modifiedTime));
                }
            }
        }
        return fileSummaries;
    }

    /**
     * Retrieves detailed metadata about a specific file.
     */
    public String getFileInfo(String filename) throws IOException {
        Path filePath = resolveSandboxedPath(filename);
        if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            return null;
        }

        BasicFileAttributes attrs = Files.readAttributes(filePath, BasicFileAttributes.class);
        String created = DATE_FORMATTER.format(attrs.creationTime().toInstant());
        String modified = DATE_FORMATTER.format(attrs.lastModifiedTime().toInstant());
        boolean isLocked = lockManager.isLocked(filename);

        return String.format("Filename: %s\nSize: %d bytes\nCreated: %s\nLast Modified: %s\nReadable: %b\nWritable: %b\nCurrently Locked: %b",
                filePath.getFileName(),
                attrs.size(),
                created,
                modified,
                Files.isReadable(filePath),
                Files.isWritable(filePath),
                isLocked);
    }

    /**
     * Deletes a file with exclusive write lock.
     * Fails if file does not exist or if it is currently locked (e.g. download in progress).
     */
    public ResponseStatus deleteFile(String filename, StringBuilder outMessage) {
        Path filePath;
        try {
            filePath = resolveSandboxedPath(filename);
        } catch (Exception e) {
            outMessage.append("Invalid filename: ").append(e.getMessage());
            return ResponseStatus.ERROR;
        }

        if (!Files.exists(filePath)) {
            outMessage.append("File '").append(filename).append("' does not exist.");
            return ResponseStatus.NOT_FOUND;
        }

        // Try to acquire write lock for 1 second (fails immediately if file is currently being downloaded or uploaded)
        boolean locked = lockManager.acquireWriteLock(filename, 1);
        if (!locked) {
            outMessage.append("File is currently in use (being downloaded or uploaded by another client).");
            return ResponseStatus.LOCKED;
        }

        try {
            Files.delete(filePath);
            outMessage.append("File '").append(filename).append("' successfully deleted.");
            return ResponseStatus.SUCCESS;
        } catch (IOException e) {
            outMessage.append("Error deleting file: ").append(e.getMessage());
            return ResponseStatus.ERROR;
        } finally {
            lockManager.releaseWriteLock(filename);
        }
    }

    /**
     * Streams incoming file bytes from client and writes them to disk.
     * Enforces exclusive write lock.
     */
    public ResponseStatus saveUploadedFile(String filename, long fileSize, InputStream clientIn, StringBuilder outMessage) {
        Path targetPath;
        try {
            targetPath = resolveSandboxedPath(filename);
        } catch (Exception e) {
            outMessage.append("Invalid filename: ").append(e.getMessage());
            return ResponseStatus.ERROR;
        }

        // Exclusive write lock
        boolean locked = lockManager.acquireWriteLock(filename, 3);
        if (!locked) {
            outMessage.append("File '").append(filename).append("' is currently locked by another client.");
            return ResponseStatus.LOCKED;
        }

        try (OutputStream fileOut = new BufferedOutputStream(Files.newOutputStream(targetPath,
                StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE))) {

            byte[] buffer = new byte[ProtocolConstants.BUFFER_SIZE];
            long bytesRemaining = fileSize;
            while (bytesRemaining > 0) {
                int readChunk = (int) Math.min(buffer.length, bytesRemaining);
                int bytesRead = clientIn.read(buffer, 0, readChunk);
                if (bytesRead == -1) {
                    throw new EOFException("Client closed stream unexpectedly before full file upload completed.");
                }
                fileOut.write(buffer, 0, bytesRead);
                bytesRemaining -= bytesRead;
            }
            fileOut.flush();
            outMessage.append("File '").append(filename).append("' (").append(fileSize).append(" bytes) uploaded successfully.");
            return ResponseStatus.SUCCESS;

        } catch (IOException e) {
            outMessage.append("Upload failed during I/O: ").append(e.getMessage());
            return ResponseStatus.ERROR;
        } finally {
            lockManager.releaseWriteLock(filename);
        }
    }

    /**
     * Streams file bytes from storage directory to client.
     * Enforces shared read lock (multiple readers allowed, writers blocked).
     */
    public ResponseStatus streamDownloadFile(String filename, OutputStream clientOut, StringBuilder outMessage, long[] outFileSize) {
        Path targetPath;
        try {
            targetPath = resolveSandboxedPath(filename);
        } catch (Exception e) {
            outMessage.append("Invalid filename: ").append(e.getMessage());
            return ResponseStatus.ERROR;
        }

        if (!Files.exists(targetPath) || !Files.isRegularFile(targetPath)) {
            outMessage.append("File '").append(filename).append("' not found on server.");
            return ResponseStatus.NOT_FOUND;
        }

        // Shared read lock
        boolean locked = lockManager.acquireReadLock(filename, 3);
        if (!locked) {
            outMessage.append("File '").append(filename).append("' is currently locked for writing/deleting.");
            return ResponseStatus.LOCKED;
        }

        try {
            long fileSize = Files.size(targetPath);
            outFileSize[0] = fileSize;

            try (InputStream fileIn = new BufferedInputStream(Files.newInputStream(targetPath))) {
                byte[] buffer = new byte[ProtocolConstants.BUFFER_SIZE];
                int bytesRead;
                while ((bytesRead = fileIn.read(buffer)) != -1) {
                    clientOut.write(buffer, 0, bytesRead);
                }
                clientOut.flush();
            }

            outMessage.append("Downloaded '").append(filename).append("' (").append(fileSize).append(" bytes).");
            return ResponseStatus.SUCCESS;

        } catch (IOException e) {
            outMessage.append("Download error: ").append(e.getMessage());
            return ResponseStatus.ERROR;
        } finally {
            lockManager.releaseReadLock(filename);
        }
    }

    /**
     * Gets file size if it exists, -1 otherwise.
     */
    public long getFileSize(String filename) {
        try {
            Path targetPath = resolveSandboxedPath(filename);
            if (Files.exists(targetPath) && Files.isRegularFile(targetPath)) {
                return Files.size(targetPath);
            }
        } catch (Exception ignored) {
        }
        return -1;
    }
}
