package com.helpdesk.controller;

import com.helpdesk.dto.TicketHistoryResponse;
import com.helpdesk.dto.TicketRequest;
import com.helpdesk.dto.TicketResponse;
import com.helpdesk.entity.Ticket;
import com.helpdesk.repository.KnowledgeArticleRepository;
import com.helpdesk.repository.TicketRepository;
import com.helpdesk.service.TicketHistoryService;
import com.helpdesk.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService               ticketService;
    private final TicketHistoryService        ticketHistoryService;
    private final TicketRepository            ticketRepository;
    private final KnowledgeArticleRepository  knowledgeArticleRepository;

    @PostMapping
    public ResponseEntity<TicketResponse> create(
            @RequestBody TicketRequest request, Authentication auth) {
        return ResponseEntity.ok(ticketService.create(request, auth.getName()));
    }

    @GetMapping
    public ResponseEntity<List<TicketResponse>> getAll() {
        return ResponseEntity.ok(ticketService.getAll());
    }

    @GetMapping("/my")
    public ResponseEntity<List<TicketResponse>> getMyTickets(Authentication auth) {
        return ResponseEntity.ok(ticketService.getMyTickets(auth.getName()));
    }

    @GetMapping("/assigned")
    public ResponseEntity<List<TicketResponse>> getAssigned(Authentication auth) {
        return ResponseEntity.ok(ticketService.getAssignedTickets(auth.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TicketResponse> update(
            @PathVariable Long id, @RequestBody TicketRequest request) {
        return ResponseEntity.ok(ticketService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id, Authentication auth) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket introuvable"));

        String userEmail = auth.getName();
        boolean isAdmin      = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isClient     = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CLIENT"));
        boolean isTechnicien = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_TECHNICIEN"));

        if (isTechnicien) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Les techniciens ne peuvent pas supprimer de tickets");
        }
        if (isClient) {
            if (!ticket.getCreatedBy().getEmail().equals(userEmail))
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous ne pouvez supprimer que vos propres tickets");
            if (!ticket.getStatus().getName().equalsIgnoreCase("Nouveau"))
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Vous ne pouvez supprimer un ticket qu'au statut Nouveau. Statut actuel : " + ticket.getStatus().getName());
        }
        if (isAdmin && !ticket.getStatus().getName().equalsIgnoreCase("Nouveau")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Seuls les tickets au statut Nouveau peuvent être supprimés. Pour les autres statuts, utilisez la clôture.");
        }
        return ResponseEntity.ok(ticketService.delete(id));
    }

    @PostMapping("/{id}/assign/{techId}")
    public ResponseEntity<TicketResponse> assignPost(@PathVariable Long id, @PathVariable Long techId) {
        return ResponseEntity.ok(ticketService.assignTicket(id, techId));
    }

    @PatchMapping("/{id}/assign/{techId}")
    public ResponseEntity<TicketResponse> assignPatch(@PathVariable Long id, @PathVariable Long techId) {
        return ResponseEntity.ok(ticketService.assignTicket(id, techId));
    }

    @PostMapping("/{id}/status/{statusId}")
    public ResponseEntity<TicketResponse> changeStatusPost(@PathVariable Long id, @PathVariable Long statusId) {
        return ResponseEntity.ok(ticketService.changeStatus(id, statusId));
    }

    @PatchMapping("/{id}/status/{statusId}")
    public ResponseEntity<TicketResponse> changeStatusPatch(@PathVariable Long id, @PathVariable Long statusId) {
        return ResponseEntity.ok(ticketService.changeStatus(id, statusId));
    }

    @PostMapping("/{id}/prendre-en-charge")
    public ResponseEntity<TicketResponse> prendreEnCharge(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ticketService.prendreEnCharge(id, auth.getName()));
    }

    @PostMapping("/{id}/escalade")
    public ResponseEntity<TicketResponse> escalade(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.escaladerTicket(id));
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<TicketResponse> closePost(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.closeTicket(id));
    }

    @PatchMapping("/{id}/close")
    public ResponseEntity<TicketResponse> closePatch(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.closeTicket(id));
    }

    @PatchMapping("/{id}/category/{categoryId}")
    public ResponseEntity<TicketResponse> updateCategory(@PathVariable Long id, @PathVariable Long categoryId) {
        return ResponseEntity.ok(ticketService.updateCategoryAndReassign(id, categoryId));
    }

    @PatchMapping("/{id}/priority/{priorityId}")
    public ResponseEntity<TicketResponse> updatePriority(@PathVariable Long id, @PathVariable Long priorityId) {
        return ResponseEntity.ok(ticketService.updatePriority(id, priorityId));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<TicketHistoryResponse>> getHistory(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ticketHistoryService.getHistory(id, auth.getName()));
    }

    // ── Épingler / désépingler un commentaire comme solution ─────────
    @PatchMapping("/{id}/solution")
    @PreAuthorize("hasRole('TECHNICIEN')")
    public ResponseEntity<?> pinSolution(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            Object raw = body.get("solutionCommentId");
            Long commentId = raw != null ? Long.valueOf(raw.toString()) : null;

            Ticket ticket = ticketRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Ticket introuvable"));
            ticket.setSolutionCommentId(commentId);
            ticketRepository.save(ticket);

            // Sync article KB si existant
            knowledgeArticleRepository.findByTicketId(id).ifPresent(article -> {
                article.setSolutionCommentId(commentId);
                knowledgeArticleRepository.save(article);
            });

            return ResponseEntity.ok(Map.of(
                    "ok", true,
                    "solutionCommentId", commentId != null ? commentId : "null"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Épingler / désépingler une pièce jointe comme solution ───────
    @PatchMapping("/{id}/solution/attachment/{attachmentId}")
    @PreAuthorize("hasRole('TECHNICIEN')")
    public ResponseEntity<?> toggleSolutionAttachment(
            @PathVariable Long id,
            @PathVariable Long attachmentId) {
        try {
            Ticket ticket = ticketRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Ticket introuvable"));

            List<Long> current = ticket.getSolutionAttachmentIds() != null
                    ? new ArrayList<>(ticket.getSolutionAttachmentIds())
                    : new ArrayList<>();

            boolean wasPinned = current.contains(attachmentId);
            if (wasPinned) {
                current.remove(attachmentId);
            } else {
                current.add(attachmentId);
            }
            ticket.setSolutionAttachmentIds(current);
            ticketRepository.save(ticket);

            // Sync article KB si existant
            final List<Long> finalCurrent = current;
            knowledgeArticleRepository.findByTicketId(id).ifPresent(article -> {
                article.setSolutionAttachmentIds(finalCurrent);
                knowledgeArticleRepository.save(article);
            });

            return ResponseEntity.ok(Map.of(
                    "ok", true,
                    "pinned", !wasPinned,
                    "solutionAttachmentIds", current
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}