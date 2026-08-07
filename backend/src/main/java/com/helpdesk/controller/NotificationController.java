package com.helpdesk.controller;

import com.helpdesk.dto.NotificationResponse;
import com.helpdesk.entity.User;
import com.helpdesk.repository.UserRepository;
import com.helpdesk.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository      userRepository;

    // ── Résout l'utilisateur depuis le JWT ────────────────────────────
    private User getUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getMesNotifications(Authentication auth) {
        return ResponseEntity.ok(notificationService.getMesNotifications(getUser(auth)));
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getNombreNonLues(Authentication auth) {
        return ResponseEntity.ok(
                Map.of("nonLues", notificationService.getNombreNonLues(getUser(auth)))
        );
    }

    @PutMapping("/{id}/lu")
    public ResponseEntity<Void> marquerLue(@PathVariable Long id, Authentication auth) {
        notificationService.marquerLue(id, getUser(auth));
        return ResponseEntity.ok().build();
    }

    @PutMapping("/toutes-lues")
    public ResponseEntity<Void> marquerToutesLues(Authentication auth) {
        notificationService.marquerToutesLues(getUser(auth));
        return ResponseEntity.ok().build();
    }
}