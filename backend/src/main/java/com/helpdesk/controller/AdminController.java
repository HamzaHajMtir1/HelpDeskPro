package com.helpdesk.controller;

import com.helpdesk.dto.AssignUserSpecialtyRequest;
import com.helpdesk.dto.CreateUserRequest;
import com.helpdesk.dto.UpdateUserRequest;
import com.helpdesk.dto.UserResponse;
import com.helpdesk.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;

    // ── Créer un utilisateur ──────────────────────────────────────────
    @PostMapping("/users")
    public ResponseEntity<String> createUser(@Valid @RequestBody CreateUserRequest request) {
        userService.createUser(request);
        return ResponseEntity.ok("Compte créé et email envoyé à " + request.getEmail());
    }

    // ── Liste tous les utilisateurs ───────────────────────────────────
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsersAsResponse());
    }

    // ── Stats par rôle ────────────────────────────────────────────────
    @GetMapping("/users/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(userService.getUserStats());
    }

    // ── Activer / Désactiver un compte ────────────────────────────────
    @PutMapping("/users/{id}/toggle")
    public ResponseEntity<String> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(userService.toggleUserStatus(id));
    }

    // ── Reset mot de passe ────────────────────────────────────────────
    @PutMapping("/users/{id}/reset-password")
    public ResponseEntity<String> resetPassword(@PathVariable Long id) {
        return ResponseEntity.ok(userService.resetPassword(id));
    }

    // ── Modifier un utilisateur ───────────────────────────────────────
    @PutMapping("/users/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request,
            Authentication auth) {
        return ResponseEntity.ok(userService.updateUser(id, request, auth.getName()));
    }

    // ── Assigner une spécialité ───────────────────────────────────────
    @PutMapping("/users/{id}/specialty")
    public ResponseEntity<UserResponse> assignSpecialty(
            @PathVariable Long id,
            @RequestBody AssignUserSpecialtyRequest request) {
        return ResponseEntity.ok(userService.assignSpecialty(id, request.getCategoryId()));
    }
}