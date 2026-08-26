package com.helpdesk.service;

import com.helpdesk.dto.*;
import com.helpdesk.entity.PasswordResetToken;
import com.helpdesk.entity.User;
import com.helpdesk.repository.PasswordResetTokenRepository;
import com.helpdesk.repository.UserRepository;
import com.helpdesk.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    // Cryptographically strong RNG for the password-reset OTP. java.util.Random
    // is predictable from observed output (Sonar java:S2245) — for an account
    // recovery code that means an attacker could guess it and take over the
    // account. SecureRandom (a CSPRNG) closes that. Thread-safe; one instance.
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository               userRepository;
    private final PasswordEncoder              passwordEncoder;
    private final JwtUtil                      jwtUtil;
    private final EmailService                 emailService;
    private final SystemSettingService         systemSettingService;
    private final PasswordResetTokenRepository tokenRepository;

    // ════════════════════════════════════════════════
    // LOGIN
    // ════════════════════════════════════════════════
    public LoginResponse login(LoginRequest request) {

        // Cherche l'user par email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        // ── Vérifie si le compte est temporairement bloqué ──
        if (user.getLockedUntil() != null
                && user.getLockedUntil().isAfter(LocalDateTime.now())) {
            long minutesLeft = java.time.Duration.between(
                    LocalDateTime.now(), user.getLockedUntil()).toMinutes() + 1;
            throw new RuntimeException("LOCKED:" + minutesLeft);
        }

        // ── Vérifie que le compte est actif ──
        if (!user.isEnabled()) {
            throw new RuntimeException("Compte désactivé");
        }

        // ── Vérifie le mot de passe ──
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {

            // Lit le max depuis la DB (configurable par l'admin)
            int maxAttempts = Integer.parseInt(
                    systemSettingService.getSettings().getMaxLoginAttempts()
            );

            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);

            if (attempts >= maxAttempts) {
                // Bloque le compte 15 minutes
                user.setLockedUntil(LocalDateTime.now().plusMinutes(15));
                user.setFailedLoginAttempts(0); // reset pour le prochain cycle
                userRepository.save(user);

                // Email d'alerte sécurité (async — ne bloque pas la réponse)
                emailService.sendSecurityAlert(
                        user.getEmail(),
                        user.getFirstName() + " " + user.getLastName(),
                        request.getIpAddress() != null ? request.getIpAddress() : "Inconnue",
                        LocalDateTime.now().format(
                                DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"))
                );

                throw new RuntimeException("LOCKED:15");
            }

            userRepository.save(user);
            int remaining = maxAttempts - attempts;
            throw new RuntimeException("Mot de passe incorrect. "
                    + remaining + " tentative(s) restante(s) avant blocage.");
        }

        // ── Connexion réussie → reset le compteur ──
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        // Génère le token JWT
        String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getRole().name()
        );

        return new LoginResponse(
                token,
                user.getRole().name(),
                user.isMustChangePassword(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getId()
        );
    }

    // ════════════════════════════════════════════════
    // CHANGER MOT DE PASSE (première connexion)
    // ════════════════════════════════════════════════
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {

        log.info("[changePassword] Appel pour email={}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        log.info("[changePassword] mustChangePassword={}", user.isMustChangePassword());

        // Lire la longueur minimale depuis la DB
        int minLength = 6;
        try {
            minLength = Integer.parseInt(
                    systemSettingService.getSettings().getPasswordMinLength()
            );
        } catch (NumberFormatException ignored) {}

        if (request.getNewPassword() == null
                || request.getNewPassword().length() < minLength) {
            throw new RuntimeException(
                    "Le mot de passe doit contenir au moins " + minLength + " caractères");
        }

        // Vérifier l'ancien mot de passe (sauf première connexion)
        if (!user.isMustChangePassword()) {
            if (request.getOldPassword() == null || request.getOldPassword().isBlank()) {
                throw new RuntimeException("Veuillez saisir votre ancien mot de passe");
            }
            if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
                throw new RuntimeException("Ancien mot de passe incorrect");
            }
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        // Un seul save — @Transactional gère le flush automatiquement
        userRepository.save(user);

        log.info("[changePassword] Mot de passe mis à jour avec succès pour email={}", email);
    }

    // ════════════════════════════════════════════════
    // ÉTAPE 1 — MOT DE PASSE OUBLIÉ
    // Envoie un code OTP à 6 chiffres par email
    // ════════════════════════════════════════════════
    public void sendResetCode(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException(
                        "Aucun compte trouvé avec cet email"));

        // Supprime les anciens codes non utilisés
        tokenRepository.deleteByEmail(email);

        // Génère un code OTP à 6 chiffres avec un générateur cryptographique.
        // Plage 0–999999 (l'ancien nextInt(999999) ne produisait jamais 999999) ;
        // format inchangé (String zéro-paddé à 6 chiffres), donc stockage et
        // comparaison identiques.
        String code = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));

        // Sauvegarde avec expiration 15 minutes
        PasswordResetToken token = PasswordResetToken.builder()
                .email(email)
                .code(code)
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .used(false)
                .build();
        tokenRepository.save(token);

        emailService.sendResetCode(
                email,
                user.getFirstName() + " " + user.getLastName(),
                code
        );
    }

    // ════════════════════════════════════════════════
    // ÉTAPE 2 — VÉRIFICATION DU CODE OTP
    // ════════════════════════════════════════════════
    public void verifyCode(String email, String code) {

        PasswordResetToken token = tokenRepository
                .findByEmailAndUsedFalse(email)
                .orElseThrow(() -> new RuntimeException(
                        "Code invalide ou expiré"));

        if (!token.getCode().equals(code)) {
            throw new RuntimeException("Code incorrect");
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Code expiré — demandez un nouveau code");
        }
    }

    // ════════════════════════════════════════════════
    // ÉTAPE 3 — RÉINITIALISATION DU MOT DE PASSE
    // ════════════════════════════════════════════════
    public void resetPassword(String email, String code, String newPassword) {

        PasswordResetToken token = tokenRepository
                .findByEmailAndUsedFalse(email)
                .orElseThrow(() -> new RuntimeException(
                        "Session expirée — recommencez la procédure"));

        if (!token.getCode().equals(code)) {
            throw new RuntimeException("Code invalide");
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Code expiré");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        userRepository.save(user);

        token.setUsed(true);
        tokenRepository.save(token);
    }
}