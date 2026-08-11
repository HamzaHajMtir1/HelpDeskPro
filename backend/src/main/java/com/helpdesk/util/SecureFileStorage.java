package com.helpdesk.util;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Filesystem helpers that keep user-supplied file names inside their intended
 * directory.
 *
 * <p>Attachment names reach the application from two untrusted sources:
 * {@code MultipartFile#getOriginalFilename()} and {@code @PathVariable} values.
 * Concatenating either into a path lets a caller walk out of the upload
 * directory with {@code ../}, which allows reading or deleting arbitrary files
 * (CWE-22, path traversal).
 *
 * <p>Both guards below are applied deliberately: {@link #sanitizeFileName}
 * removes the separators, and {@link #resolveInside} re-checks containment
 * after normalisation so that any future caller that forgets to sanitise is
 * still safe.
 */
public final class SecureFileStorage {

    private SecureFileStorage() {
        // utility class
    }

    /**
     * Reduces a user-supplied name to a bare file name.
     *
     * <p>Strips any directory component (both {@code /} and {@code \}, because
     * a Windows client can send back-slashes to a Linux server), rejects the
     * {@code ..} traversal token, and drops NUL bytes.
     *
     * @param rawName name as received from the client; may be {@code null}
     * @return a safe, non-empty file name
     * @throws IllegalArgumentException if nothing usable remains
     */
    public static String sanitizeFileName(String rawName) {
        if (rawName == null || rawName.isBlank()) {
            throw new IllegalArgumentException("Nom de fichier manquant");
        }

        // Keep only the last segment, whatever separator style was used.
        String name = rawName.replace('\\', '/');
        int lastSlash = name.lastIndexOf('/');
        if (lastSlash >= 0) {
            name = name.substring(lastSlash + 1);
        }

        name = name.replace("\0", "").trim();

        if (name.isEmpty() || ".".equals(name) || "..".equals(name)) {
            throw new IllegalArgumentException("Nom de fichier invalide");
        }
        return name;
    }

    /**
     * Resolves {@code fileName} inside {@code baseDir} and fails if the result
     * escapes that directory.
     *
     * @param baseDir  directory the file must stay within
     * @param fileName user-supplied file name
     * @return the resolved, normalised path, guaranteed to be under {@code baseDir}
     * @throws IllegalArgumentException if the path would escape {@code baseDir}
     */
    public static Path resolveInside(Path baseDir, String fileName) {
        Path base = baseDir.toAbsolutePath().normalize();
        Path resolved = base.resolve(sanitizeFileName(fileName)).normalize();

        if (!resolved.startsWith(base)) {
            throw new IllegalArgumentException("Chemin de fichier invalide");
        }
        return resolved;
    }

    /**
     * Convenience overload for callers that hold the directory as a string.
     */
    public static Path resolveInside(String baseDir, String fileName) {
        return resolveInside(Paths.get(baseDir), fileName);
    }

    /**
     * Creates {@code dir} (and parents) when missing.
     *
     * @return the directory, for chaining
     */
    public static Path ensureDirectory(Path dir) throws IOException {
        if (!Files.exists(dir)) {
            Files.createDirectories(dir);
        }
        return dir;
    }

    /**
     * Builds a collision-resistant stored name by prefixing a timestamp to the
     * sanitised original name.
     *
     * <p>The sanitisation happens before the prefix is applied, so a crafted
     * name such as {@code ../../evil} cannot survive as {@code 123_../../evil}.
     */
    public static String timestampedName(String rawName, long timestamp) {
        return timestamp + "_" + sanitizeFileName(rawName);
    }
}
