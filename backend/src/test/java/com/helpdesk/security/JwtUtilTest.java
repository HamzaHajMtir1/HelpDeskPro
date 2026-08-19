package com.helpdesk.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for token issuing/validation. These run without a Spring context,
 * so they also cover the failure paths that the application never reaches in a
 * happy-path integration test.
 */
class JwtUtilTest {

    /** HS256 requires >= 256 bits; anything shorter makes JJWT refuse to sign. */
    private static final String SECRET =
            "unit-test-secret-key-that-is-long-enough-0123456789";

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", SECRET);
        ReflectionTestUtils.setField(jwtUtil, "expiration", 3_600_000L);
    }

    @Test
    void issuesATokenCarryingTheSubjectAndRole() {
        String token = jwtUtil.generateToken("admin@helpdesk.com", "ADMIN");

        assertNotNull(token);
        assertEquals("admin@helpdesk.com", jwtUtil.extractEmail(token));
        assertEquals("ADMIN", jwtUtil.extractRole(token));
        assertTrue(jwtUtil.isValid(token));
    }

    @Test
    void acceptsItsOwnFreshlyIssuedToken() {
        assertTrue(jwtUtil.isValid(jwtUtil.generateToken("user@example.com", "CLIENT")));
    }

    @Test
    void rejectsATokenSignedWithAnotherKey() {
        // Forged token: correct structure, wrong signing key.
        String forged = Jwts.builder()
                .setSubject("attacker@example.com")
                .claim("role", "ADMIN")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(Keys.hmacShaKeyFor(
                        "a-completely-different-secret-key-0123456789".getBytes(
                                StandardCharsets.UTF_8)),
                        SignatureAlgorithm.HS256)
                .compact();

        assertFalse(jwtUtil.isValid(forged),
                "a token signed with a foreign key must never validate");
    }

    @Test
    void rejectsAnExpiredToken() {
        ReflectionTestUtils.setField(jwtUtil, "expiration", -1_000L); // already past
        String expired = jwtUtil.generateToken("user@example.com", "CLIENT");

        assertFalse(jwtUtil.isValid(expired));
    }

    @Test
    void rejectsGarbageAndTamperedTokens() {
        assertFalse(jwtUtil.isValid("not-a-jwt"));
        assertFalse(jwtUtil.isValid(""));

        String token = jwtUtil.generateToken("user@example.com", "CLIENT");
        // Flip the payload: signature no longer matches.
        String tampered = token.substring(0, token.lastIndexOf('.')) + ".AAAA";
        assertFalse(jwtUtil.isValid(tampered));
    }

    @Test
    void derivesTheKeyWithAnExplicitCharset() {
        // Regression guard: the key was previously derived with the platform
        // default charset, so a non-ASCII secret produced different keys on
        // different machines. Issuing and validating must agree here.
        String accented = "clé-secrète-très-longue-pour-hs256-0123456789-àéîöû";
        ReflectionTestUtils.setField(jwtUtil, "secret", accented);

        String token = jwtUtil.generateToken("user@example.com", "TECHNICIEN");
        assertTrue(jwtUtil.isValid(token));
        assertEquals("TECHNICIEN", jwtUtil.extractRole(token));
    }
}
