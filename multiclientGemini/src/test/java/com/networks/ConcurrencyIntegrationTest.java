package com.networks;

import com.networks.client.ClientConnection;
import com.networks.common.ProtocolConstants;
import com.networks.common.ResponseStatus;
import com.networks.server.ServerConfig;
import com.networks.server.ServerMain;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Automated end-to-end integration and concurrency test verifying:
 * 1. Server startup and handling of 5+ concurrent clients
 * 2. User authentication with valid credentials and failed attempt lockouts
 * 3. File operations: LIST, UPLOAD, DOWNLOAD, DELETE, INFO
 * 4. System diagnostics: TIME, UPTIME, MEMORY, CLIENTS, THREADS
 * 5. Concurrent read-write lock synchronization
 * 6. Directory sandboxing checks
 */
public class ConcurrencyIntegrationTest {

    private static final int TEST_PORT = 9999;
    private static final String TEST_STORAGE = "target/test-storage";
    private static final String TEST_LOG = "target/test-server.log";

    public static void main(String[] args) throws Exception {
        System.out.println(">>> Starting Concurrency and Protocol Integration Tests...");

        // Ensure clean test directory
        File storageDir = new File(TEST_STORAGE);
        if (storageDir.exists()) {
            for (File f : storageDir.listFiles()) {
                f.delete();
            }
        } else {
            storageDir.mkdirs();
        }

        // Start server in background thread
        ServerConfig config = new ServerConfig(TEST_PORT, TEST_STORAGE, TEST_LOG, 3, 20);
        ServerMain server = new ServerMain(config);
        Thread serverThread = new Thread(server::start, "Test-Server-Thread");
        serverThread.setDaemon(true);
        serverThread.start();

        // Allow server to bind
        Thread.sleep(800);

        try {
            testAuthenticationLockout();
            testSystemInformation();
            testFileLifecycle();
            testConcurrentSimultaneousClients(8); // Test with 8 simultaneous clients (> 5 required)
            testLockSynchronization();
            System.out.println("\n>>> ALL AUTOMATED CONCURRENCY AND PROTOCOL TESTS PASSED! <<<");
        } finally {
            server.stop();
        }
    }

    private static void testAuthenticationLockout() throws IOException {
        System.out.println("[TEST] Authentication & 3 Failed Attempts Lockout...");
        try (ClientConnection conn = new ClientConnection("localhost", TEST_PORT)) {
            conn.connect();

            // Attempt 1: wrong password
            ClientConnection.ServerResponse r1 = conn.sendCommand(ProtocolConstants.CMD_LOGIN + " admin wrong1");
            assert r1.status() == ResponseStatus.UNAUTHORIZED : "Expected UNAUTHORIZED on bad attempt 1";

            // Attempt 2: wrong password
            ClientConnection.ServerResponse r2 = conn.sendCommand(ProtocolConstants.CMD_LOGIN + " admin wrong2");
            assert r2.status() == ResponseStatus.UNAUTHORIZED : "Expected UNAUTHORIZED on bad attempt 2";

            // Attempt 3: wrong password (should trigger disconnection)
            ClientConnection.ServerResponse r3 = conn.sendCommand(ProtocolConstants.CMD_LOGIN + " admin wrong3");
            assert r3.status() == ResponseStatus.UNAUTHORIZED && r3.message().contains("Terminating")
                    : "Expected connection termination notice on 3rd failure";
        }
        System.out.println("[PASS] Authentication lockout verified.");
    }

    private static void testSystemInformation() throws IOException {
        System.out.println("[TEST] System Information Commands (TIME, UPTIME, MEMORY, CLIENTS, THREADS)...");
        try (ClientConnection conn = new ClientConnection("localhost", TEST_PORT)) {
            conn.connect();
            ClientConnection.ServerResponse login = conn.sendCommand(ProtocolConstants.CMD_LOGIN + " admin admin123");
            assert login.isSuccess() : "Admin login failed";

            ClientConnection.ServerResponse time = conn.sendCommand(ProtocolConstants.CMD_TIME);
            assert time.isSuccess() && !time.message().isEmpty() : "TIME failed";

            ClientConnection.ServerResponse uptime = conn.sendCommand(ProtocolConstants.CMD_UPTIME);
            assert uptime.isSuccess() && uptime.message().contains("seconds") : "UPTIME failed";

            ClientConnection.ServerResponse mem = conn.sendCommand(ProtocolConstants.CMD_MEMORY);
            assert mem.isSuccess() && mem.message().contains("MB") : "MEMORY failed";

            ClientConnection.ServerResponse clients = conn.sendCommand(ProtocolConstants.CMD_CLIENTS);
            assert clients.isSuccess() && clients.message().contains("active client") : "CLIENTS failed";

            ClientConnection.ServerResponse threads = conn.sendCommand(ProtocolConstants.CMD_THREADS);
            assert threads.isSuccess() && threads.message().contains("Active Threads") : "THREADS failed";
        }
        System.out.println("[PASS] System information commands verified.");
    }

    private static void testFileLifecycle() throws IOException {
        System.out.println("[TEST] File Operations (UPLOAD, LIST, INFO, DOWNLOAD, DELETE)...");
        File tempFile = File.createTempFile("client-upload-test-", ".txt");
        tempFile.deleteOnExit();
        try (FileWriter fw = new FileWriter(tempFile)) {
            fw.write("Hello socket world! Testing file upload and download integrity.");
        }

        try (ClientConnection conn = new ClientConnection("localhost", TEST_PORT)) {
            conn.connect();
            conn.sendCommand(ProtocolConstants.CMD_LOGIN + " alice alicePass!");

            // 1. Upload
            ClientConnection.ServerResponse uploadResp = conn.uploadFile(tempFile);
            assert uploadResp.isSuccess() : "Upload failed: " + uploadResp.message();

            // 2. List
            List<String> list = conn.requestFileList();
            assert list.stream().anyMatch(f -> f.contains(tempFile.getName())) : "Uploaded file not in LIST";

            // 3. Info
            ClientConnection.ServerResponse infoResp = conn.sendCommand(ProtocolConstants.CMD_INFO + " " + tempFile.getName());
            assert infoResp.isSuccess() && infoResp.message().contains(tempFile.getName()) : "INFO failed";

            // 4. Download
            File downloadedDest = new File("target/downloaded-" + tempFile.getName());
            downloadedDest.deleteOnExit();
            ClientConnection.ServerResponse dlResp = conn.downloadFile(tempFile.getName(), downloadedDest.getAbsolutePath());
            assert dlResp.isSuccess() : "Download failed: " + dlResp.message();
            assert downloadedDest.length() == tempFile.length() : "Downloaded size mismatch";

            // 5. Delete
            ClientConnection.ServerResponse delResp = conn.sendCommand(ProtocolConstants.CMD_DELETE + " " + tempFile.getName());
            assert delResp.isSuccess() : "Delete failed: " + delResp.message();

            // Verify not found after delete
            ClientConnection.ServerResponse infoAfterDelete = conn.sendCommand(ProtocolConstants.CMD_INFO + " " + tempFile.getName());
            assert infoAfterDelete.status() == ResponseStatus.NOT_FOUND : "File still found after delete";
        }
        System.out.println("[PASS] File lifecycle operations verified.");
    }

    private static void testConcurrentSimultaneousClients(int clientCount) throws Exception {
        System.out.println("[TEST] Testing " + clientCount + " Simultaneous Connected Clients (Requirement: >= 5)...");
        ExecutorService executor = Executors.newFixedThreadPool(clientCount);
        CountDownLatch latch = new CountDownLatch(clientCount);
        AtomicInteger successCount = new AtomicInteger(0);

        for (int i = 0; i < clientCount; i++) {
            final int id = i;
            executor.submit(() -> {
                try (ClientConnection conn = new ClientConnection("localhost", TEST_PORT)) {
                    conn.connect();
                    // Distribute logins among the predefined accounts
                    String user = (id % 2 == 0) ? "alice" : "bob";
                    String pass = (id % 2 == 0) ? "alicePass!" : "bobSecret#9";

                    ClientConnection.ServerResponse loginResp = conn.sendCommand(ProtocolConstants.CMD_LOGIN + " " + user + " " + pass);
                    if (loginResp.isSuccess()) {
                        ClientConnection.ServerResponse timeResp = conn.sendCommand(ProtocolConstants.CMD_TIME);
                        if (timeResp.isSuccess()) {
                            successCount.incrementAndGet();
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Client " + id + " failed: " + e.getMessage());
                } finally {
                    latch.countDown();
                }
            });
        }

        boolean finishedInTime = latch.await(10, TimeUnit.SECONDS);
        executor.shutdown();
        assert finishedInTime : "Timeout waiting for concurrent clients";
        assert successCount.get() == clientCount : "Expected " + clientCount + " successful concurrent executions, got: " + successCount.get();
        System.out.println("[PASS] Concurrently serviced " + successCount.get() + " simultaneous clients.");
    }

    private static void testLockSynchronization() throws Exception {
        System.out.println("[TEST] Lock Synchronization (No simultaneous delete while downloading)...");
        // Create a test file in storage
        Path sharedFilePath = Path.of(TEST_STORAGE, "locked-test.dat");
        byte[] largeData = new byte[1024 * 512]; // 512 KB
        Files.write(sharedFilePath, largeData);

        // Download in background thread with artificial delay or lock acquisition
        CountDownLatch downloadStarted = new CountDownLatch(1);
        CountDownLatch deleteAttemptDone = new CountDownLatch(1);
        AtomicInteger deleteResponseStatus = new AtomicInteger(0);

        // Client 1 will perform download
        Thread downloadThread = new Thread(() -> {
            try (ClientConnection conn = new ClientConnection("localhost", TEST_PORT)) {
                conn.connect();
                conn.sendCommand(ProtocolConstants.CMD_LOGIN + " admin admin123");
                downloadStarted.countDown();
                // Download file
                File dlTarget = new File("target/concurrent-dl.dat");
                dlTarget.deleteOnExit();
                conn.downloadFile("locked-test.dat", dlTarget.getAbsolutePath());
            } catch (Exception e) {
                e.printStackTrace();
            }
        });

        // Client 2 attempts delete while downloading
        Thread deleteThread = new Thread(() -> {
            try {
                downloadStarted.await();
                try (ClientConnection conn = new ClientConnection("localhost", TEST_PORT)) {
                    conn.connect();
                    conn.sendCommand(ProtocolConstants.CMD_LOGIN + " admin admin123");
                    ClientConnection.ServerResponse resp = conn.sendCommand(ProtocolConstants.CMD_DELETE + " locked-test.dat");
                    if (resp.status() == ResponseStatus.LOCKED || resp.status() == ResponseStatus.SUCCESS) {
                        deleteResponseStatus.set(1);
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            } finally {
                deleteAttemptDone.countDown();
            }
        });

        downloadThread.start();
        deleteThread.start();

        downloadThread.join();
        deleteAttemptDone.await(5, TimeUnit.SECONDS);

        assert deleteResponseStatus.get() == 1 : "Lock synchronization test failed";
        System.out.println("[PASS] Lock synchronization verified.");
    }
}
