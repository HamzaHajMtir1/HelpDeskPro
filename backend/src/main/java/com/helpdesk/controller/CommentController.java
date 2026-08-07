package com.helpdesk.controller;

import com.helpdesk.dto.CommentRequest;
import com.helpdesk.dto.CommentResponse;
import com.helpdesk.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller commentaires — simplifié.
 *
 * Toute la logique métier (rôles, interne/public, historique, notifications)
 * est centralisée dans CommentService.
 *
 * AVANT : le controller chargeait lui-même Ticket + User pour vérifier le rôle,
 * puis le service les rechargeait → double requête DB + NPE possible si
 * ticket.getAssignedTo() était null après une réassignation récente → 500.
 *
 * APRÈS : le controller délègue directement au service avec l'email du principal.
 */
@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    /**
     * POST /api/tickets/{ticketId}/comments
     *
     * Accessible aux 3 rôles : CLIENT, TECHNICIEN, ADMIN.
     * Les règles de visibilité (interne/public/intervention) sont appliquées dans CommentService.
     */
    @PostMapping("/{ticketId}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long ticketId,
            @Valid @RequestBody CommentRequest request,
            Authentication auth) {

        return ResponseEntity.ok(
                commentService.addComment(ticketId, request, auth.getName()));
    }

    /**
     * GET /api/tickets/{ticketId}/comments
     */
    @GetMapping("/{ticketId}/comments")
    public ResponseEntity<List<CommentResponse>> getByTicket(
            @PathVariable Long ticketId) {
        return ResponseEntity.ok(commentService.getByTicket(ticketId));
    }
}