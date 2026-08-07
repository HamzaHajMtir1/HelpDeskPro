package com.helpdesk.controller;

import com.helpdesk.dto.AccountRequestDTO;

import com.helpdesk.dto.ApproveRequestDTO;

import com.helpdesk.dto.CreateUserRequest;

import com.helpdesk.entity.AccountRequest;

import com.helpdesk.entity.RequestStatus;

import com.helpdesk.repository.AccountRequestRepository;

import com.helpdesk.repository.UserRepository;

import com.helpdesk.service.EmailService;

import com.helpdesk.service.UserService;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;

import org.springframework.http.HttpStatus;

import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;

import java.util.List;

import java.util.Map;

@RestController

@RequestMapping("/api/account-requests")

@RequiredArgsConstructor

public class AccountRequestController {

    private final AccountRequestRepository repo;

    private final UserRepository           userRepository;

    private final UserService              userService;

    private final EmailService             emailService;

    @Value("${admin.email}")

    private String adminEmail;

    // ════════════════════════════════════════════════════════

    //  PUBLIC — vérification disponibilité email

    // ════════════════════════════════════════════════════════

    @GetMapping("/check-email")

    public ResponseEntity<?> checkEmail(@RequestParam String email) {

        boolean emailExistsAsUser    = userRepository.existsByEmail(email);

        boolean hasPendingRequest    = repo.existsByEmailAndStatus(email, RequestStatus.PENDING);

        boolean hasApprovedRequest   = repo.existsByEmailAndStatus(email, RequestStatus.APPROVED);

        if (emailExistsAsUser || hasApprovedRequest) {

            return ResponseEntity.ok(Map.of(

                    "available", false,

                    "reason",    "ACCOUNT_EXISTS",

                    "message",   "Cette adresse email est déjà associée à un compte existant."

            ));

        }

        if (hasPendingRequest) {

            return ResponseEntity.ok(Map.of(

                    "available", false,

                    "reason",    "PENDING_REQUEST",

                    "message",   "Une demande de compte avec cette adresse est déjà en cours de traitement. " +

                            "Vous recevrez un email dès qu'elle sera traitée."

            ));

        }

        return ResponseEntity.ok(Map.of(

                "available", true,

                "message",   "Email disponible"

        ));

    }

    // ════════════════════════════════════════════════════════

    //  PUBLIC — soumission formulaire landing page

    // ════════════════════════════════════════════════════════

    @PostMapping

    public ResponseEntity<?> submitRequest(@RequestBody AccountRequestDTO dto) {

        if (userRepository.existsByEmail(dto.getEmail())) {

            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(

                    "error",   "EMAIL_EXISTS",

                    "message", "Cette adresse email est déjà associée à un compte existant."

            ));

        }

        if (repo.existsByEmailAndStatus(dto.getEmail(), RequestStatus.PENDING)) {

            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(

                    "error",   "PENDING_REQUEST",

                    "message", "Une demande avec cette adresse email est déjà en attente de traitement."

            ));

        }

        AccountRequest req = new AccountRequest();

        req.setFullName(dto.getFullName());

        req.setEmail(dto.getEmail());

        req.setPhone(dto.getPhone());

        req.setCompany(dto.getCompany());

        req.setMessage(dto.getMessage());

        repo.save(req);

        emailService.sendRequestConfirmation(req.getEmail(), req.getFullName());

        emailService.notifyAdminNewRequest(

                adminEmail,

                req.getFullName(),

                req.getEmail(),

                req.getPhone(),

                req.getCompany(),

                req.getMessage()

        );

        return ResponseEntity.ok(Map.of("message", "Demande reçue"));

    }

    // ════════════════════════════════════════════════════════

    //  ADMIN — liste toutes les demandes

    // ════════════════════════════════════════════════════════

    @GetMapping

    @PreAuthorize("hasRole('ADMIN')")

    public List<AccountRequest> getAll() {

        return repo.findAll();

    }

    // ════════════════════════════════════════════════════════

    //  ADMIN — approuver et créer le compte

    // ════════════════════════════════════════════════════════

    @PostMapping("/{id}/approve")

    @PreAuthorize("hasRole('ADMIN')")

    public ResponseEntity<?> approve(@PathVariable Long id,

                                     @RequestBody ApproveRequestDTO dto) {

        AccountRequest req = repo.findById(id)

                .orElseThrow(() -> new RuntimeException("Demande introuvable : " + id));

        if (userRepository.existsByEmail(dto.getUsername())) {

            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(

                    "error",   "EMAIL_EXISTS",

                    "message", "L'adresse email " + dto.getUsername() +

                            " est déjà associée à un compte existant. " +

                            "Modifiez l'email dans le formulaire ou contactez le demandeur."

            ));

        }

        // Découper fullName en prénom / nom

        String fullName  = req.getFullName() != null ? req.getFullName().trim() : "";

        int    spaceIdx  = fullName.indexOf(' ');

        String firstName = spaceIdx > 0 ? fullName.substring(0, spaceIdx) : fullName;

        String lastName  = spaceIdx > 0 ? fullName.substring(spaceIdx + 1) : "";

        // ✅ Construire le DTO avec company + phone issus de la demande

        CreateUserRequest createReq = new CreateUserRequest();

        createReq.setFirstName(firstName);

        createReq.setLastName(lastName);

        createReq.setEmail(dto.getUsername());

        createReq.setRole(dto.getRole());

        createReq.setCompany(dto.getCompany() != null ? dto.getCompany() : req.getCompany());

        createReq.setPhone(dto.getPhone()   != null ? dto.getPhone()   : req.getPhone());
        createReq.setSpecialtyCategoryId(dto.getSpecialtyCategoryId()); // ✅ après setPhone(...)

        try {

            userService.createUserFromRequest(createReq, dto.getTempPassword());

        } catch (Exception e) {

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(

                    "error",   "CREATE_FAILED",

                    "message", "Impossible de créer le compte : " + e.getMessage()

            ));

        }

        req.setStatus(RequestStatus.APPROVED);

        repo.save(req);

        emailService.sendCredentials(

                dto.getUsername(),

                req.getFullName(),

                dto.getTempPassword()

        );

        return ResponseEntity.ok(Map.of("message", "Compte créé et email envoyé"));

    }

    // ════════════════════════════════════════════════════════

    //  ADMIN — rejeter une demande + email au client

    // ════════════════════════════════════════════════════════

    @PostMapping("/{id}/reject")

    @PreAuthorize("hasRole('ADMIN')")

    public ResponseEntity<?> reject(@PathVariable Long id,

                                    @RequestBody(required = false) Map<String, String> body) {

        AccountRequest req = repo.findById(id)

                .orElseThrow(() -> new RuntimeException("Demande introuvable : " + id));

        req.setStatus(RequestStatus.REJECTED);

        repo.save(req);

        String reason = body != null ? body.getOrDefault("reason", null) : null;

        emailService.sendRequestRejected(

                req.getEmail(),

                req.getFullName(),

                reason

        );

        return ResponseEntity.ok(Map.of("message", "Demande rejetée et client notifié"));

    }

}
