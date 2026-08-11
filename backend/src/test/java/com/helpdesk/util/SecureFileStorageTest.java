package com.helpdesk.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Guards the path-traversal fix. Every case below corresponds to a payload
 * that previously escaped the upload directory through
 * {@code "uploads/knowledge/" + id + "/" + fileName}.
 */
class SecureFileStorageTest {

    // ── sanitizeFileName ────────────────────────────────────────────────────

    @Test
    void keepsAPlainFileNameUnchanged() {
        assertEquals("rapport.pdf", SecureFileStorage.sanitizeFileName("rapport.pdf"));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "../../etc/passwd",
            "../../../root/.ssh/id_rsa",
            "subdir/../../escape.txt",
            "/etc/shadow",
            "uploads/other/file.txt"
    })
    void stripsUnixDirectoryComponents(String hostile) {
        String safe = SecureFileStorage.sanitizeFileName(hostile);
        assertFalse(safe.contains("/"), "no separator may survive: " + safe);
        assertNotEquals("..", safe);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "..\\..\\windows\\system32\\config\\sam",
            "C:\\Windows\\win.ini",
            "folder\\..\\..\\escape.txt"
    })
    void stripsWindowsDirectoryComponents(String hostile) {
        // A Windows client can send back-slashes to a Linux server, where they
        // are NOT separators — so they must be handled explicitly.
        String safe = SecureFileStorage.sanitizeFileName(hostile);
        assertFalse(safe.contains("\\"), "no back-slash may survive: " + safe);
        assertFalse(safe.contains("/"));
    }

    @Test
    void removesNulBytesWithoutTruncatingTheName() {
        // The NUL byte is dropped rather than used as a terminator: truncating
        // to "evil.txt" is what the classic poison-NUL attack wants, so the
        // remainder of the name is deliberately kept.
        String safe = SecureFileStorage.sanitizeFileName("evil.txt\0.png");

        assertEquals("evil.txt.png", safe);
        assertFalse(safe.contains("\0"));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   ", "..", ".", "../", "/"})
    void rejectsNamesWithNothingUsableLeft(String bad) {
        assertThrows(IllegalArgumentException.class,
                () -> SecureFileStorage.sanitizeFileName(bad));
    }

    // ── resolveInside ───────────────────────────────────────────────────────

    @Test
    void resolvesAPlainNameInsideTheBaseDirectory(@TempDir Path base) {
        Path resolved = SecureFileStorage.resolveInside(base, "rapport.pdf");
        assertTrue(resolved.startsWith(base.toAbsolutePath().normalize()));
        assertEquals("rapport.pdf", resolved.getFileName().toString());
    }

    @ParameterizedTest
    @ValueSource(strings = {"../outside.txt", "../../outside.txt", "..\\outside.txt"})
    void neverEscapesTheBaseDirectory(String hostile, @TempDir Path base) {
        Path resolved = SecureFileStorage.resolveInside(base, hostile);
        assertTrue(resolved.startsWith(base.toAbsolutePath().normalize()),
                "resolved outside the base directory: " + resolved);
    }

    @Test
    void writingThroughResolveInsideCannotTouchASiblingDirectory(@TempDir Path tmp)
            throws IOException {
        Path base    = Files.createDirectories(tmp.resolve("uploads/knowledge/1"));
        Path secrets = Files.createDirectories(tmp.resolve("secrets"));
        Path victim  = Files.writeString(secrets.resolve("token.txt"), "original");

        // The exact payload that used to escape: "1700000000_../../../secrets/token.txt"
        String stored = SecureFileStorage.timestampedName(
                "../../../secrets/token.txt", 1_700_000_000L);
        Path dest = SecureFileStorage.resolveInside(base, stored);
        Files.writeString(dest, "attacker-controlled");

        assertEquals("original", Files.readString(victim),
                "the sibling file must not have been overwritten");
        assertTrue(dest.startsWith(base.toAbsolutePath().normalize()));
    }

    // ── timestampedName ─────────────────────────────────────────────────────

    @Test
    void prefixesTheTimestampAfterSanitising() {
        // Sanitisation must happen BEFORE the prefix, otherwise the traversal
        // survives as "123_../../evil".
        assertEquals("123_evil.sh",
                SecureFileStorage.timestampedName("../../evil.sh", 123L));
    }

    @Test
    void timestampedNameRejectsAnUnusableName() {
        assertThrows(IllegalArgumentException.class,
                () -> SecureFileStorage.timestampedName("../", 123L));
    }

    // ── ensureDirectory ─────────────────────────────────────────────────────

    @Test
    void createsMissingDirectoriesAndIsIdempotent(@TempDir Path tmp) throws IOException {
        Path target = tmp.resolve("a/b/c");
        assertEquals(target, SecureFileStorage.ensureDirectory(target));
        assertTrue(Files.isDirectory(target));
        assertEquals(target, SecureFileStorage.ensureDirectory(target));
    }
}
