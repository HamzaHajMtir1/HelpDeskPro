package com.helpdesk.controller;

import com.helpdesk.dto.*;
import com.helpdesk.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ── Changement mot de passe ──────────────────────────────
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            Authentication auth,
            @RequestBody ChangePasswordRequest request) {
        try {
            authService.changePassword(auth.getName(), request);
            return ResponseEntity.ok(Map.of("message", "Mot de passe mis à jour avec succès"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // ── Étape 1 : envoie le code OTP ─────────────────────────
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        authService.sendResetCode(request.getEmail());
        return ResponseEntity.ok("Code envoyé à " + request.getEmail());
    }

    // ── Étape 2 : vérifie le code OTP ────────────────────────
    @PostMapping("/verify-reset-code")
    public ResponseEntity<String> verifyCode(
            @Valid @RequestBody VerifyCodeRequest request) {
        authService.verifyCode(request.getEmail(), request.getCode());
        return ResponseEntity.ok("Code valide");
    }

    // ── Étape 3 : nouveau mot de passe ───────────────────────
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(
                request.getEmail(),
                request.getCode(),
                request.getNewPassword()
        );
        return ResponseEntity.ok("Mot de passe réinitialisé avec succès");
    }

    // ── Login ─────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        try {
            String ip = httpRequest.getHeader("X-Forwarded-For");
            if (ip == null || ip.isBlank()) ip = httpRequest.getRemoteAddr();
            request.setIpAddress(ip);

            return ResponseEntity.ok(authService.login(request));

        } catch (RuntimeException e) {
            String msg = e.getMessage();

            if (msg != null && msg.startsWith("LOCKED:")) {
                long minutes = Long.parseLong(msg.split(":")[1]);
                return ResponseEntity.status(423)
                        .body(Map.of(
                                "message", "Compte temporairement bloqué.",
                                "minutesLeft", minutes
                        ));
            }

            return ResponseEntity.status(401)
                    .body(Map.of("message", msg));
        }
    }
}