package com.helpdesk.controller;

import com.helpdesk.dto.SystemSettingsRequest;
import com.helpdesk.dto.SystemSettingsResponse;
import com.helpdesk.service.SystemSettingService;
import com.helpdesk.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/settings")
@RequiredArgsConstructor
public class SystemSettingController {

    private final SystemSettingService systemSettingService;
    private final EmailService emailService;

    @GetMapping
    public ResponseEntity<SystemSettingsResponse> get() {
        return ResponseEntity.ok(systemSettingService.getSettings());
    }

    @PutMapping
    public ResponseEntity<SystemSettingsResponse> update(
            @RequestBody SystemSettingsRequest request) {
        return ResponseEntity.ok(systemSettingService.updateSettings(request));
    }

    @PostMapping("/email/test")
    public ResponseEntity<?> testEmail(@RequestBody Map<String, String> body) {
        try {
            String to = body.getOrDefault("toEmail", "");
            if (to.isBlank()) throw new RuntimeException("Email destinataire manquant");
            emailService.sendTestEmail(to);
            return ResponseEntity.ok(Map.of("message", "Email de test envoyé"));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // ── Endpoint public : config de sécurité uniquement ──────────────
    // Accessible à tous les utilisateurs authentifiés (pas seulement ADMIN)
    @GetMapping("/public")
    public ResponseEntity<Map<String, String>> getPublicConfig() {
        SystemSettingsResponse s = systemSettingService.getSettings();
        return ResponseEntity.ok(Map.of(
                "passwordMinLength", s.getPasswordMinLength(),
                "requireUppercase",  s.getRequireUppercase(),
                "requireNumbers",    s.getRequireNumbers(),
                "requireSpecialChar",s.getRequireSpecialChar()
        ));
    }
}