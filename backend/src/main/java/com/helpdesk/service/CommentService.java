package com.helpdesk.service;

import com.helpdesk.dto.CommentRequest;
import com.helpdesk.dto.CommentResponse;
import com.helpdesk.entity.Comment;
import com.helpdesk.entity.Ticket;
import com.helpdesk.entity.TicketHistory.ActionType;
import com.helpdesk.entity.User;
import com.helpdesk.repository.CommentRepository;
import com.helpdesk.repository.TicketRepository;
import com.helpdesk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository    commentRepository;
    private final TicketRepository     ticketRepository;
    private final UserRepository       userRepository;
    private final TicketHistoryService ticketHistoryService;
    private final NotificationService  notificationService;

    // ════════════════════════════════════════════════════════════════
    //  AJOUT D'UN COMMENTAIRE
    //
    //  DÉTECTION DU TYPE (par ordre de priorité) :
    //
    //  1. ADMIN_INTERVENTION — préfixe [INTERVENTION ADMIN
    //     → note interne, visible TECH + ADMIN, masqué CLIENT
    //
    //  2. ADMIN_INTERVENTION — préfixe [RÉASSIGNATION ADMIN
    //     → note interne, visible TECH + ADMIN, masqué CLIENT
    //
    //  3. NOTE_INTERNE_ADDED — interne=true, sans préfixe SLA
    //     → visible uniquement par l'auteur + ADMIN
    //
    //  4. COMMENT_ADDED — commentaire public
    //     → visible par tous
    // ════════════════════════════════════════════════════════════════
    @Transactional
    public CommentResponse addComment(Long ticketId, CommentRequest request, String email) {

        // ── 1. Chargement des entités ──────────────────────────────
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable : id=" + ticketId));
        User author = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + email));

        // ── 2. Sécurité : forcer interne si tech non assigné ───────
        boolean isAdminUser = author.getRole() == User.Role.ADMIN;
        boolean isTechUser  = author.getRole() == User.Role.TECHNICIEN;
        boolean isClientUser = author.getRole() == User.Role.CLIENT;

        if (isTechUser) {
            boolean isAssigned = ticket.getAssignedTo() != null
                    && ticket.getAssignedTo().getId().equals(author.getId());
            if (!isAssigned) {
                request.setInterne(true);
            }
        }
        // Client → toujours public
        if (isClientUser) {
            request.setInterne(false);
        }

        // ── 3. Sauvegarde du commentaire ───────────────────────────
        Comment comment = Comment.builder()
                .content(request.getContent())
                .interne(request.isInterne())
                .ticket(ticket)
                .author(author)
                .build();

        Comment saved = commentRepository.save(comment);

        // ── 4. Détermination du type d'action historique ───────────
        final String     content          = request.getContent();
        final ActionType action;
        final String     oldVal;
        final String     newVal;

        boolean isAdminIntervention = isAdminUser
                && content != null
                && content.startsWith("[INTERVENTION ADMIN");

        boolean isAdminReassign = isAdminUser
                && content != null
                && content.startsWith("[RÉASSIGNATION ADMIN");

        if (isAdminIntervention) {
            // ── Intervention admin SLA ─────────────────────────────
            // Visible : TECH + ADMIN | Masqué : CLIENT
            action = ActionType.ADMIN_INTERVENTION;
            oldVal = null;
            String motif  = extractMotif(content);
            String retard = extractRetard(content);
            newVal = "SLA dépassé de " + retard
                    + (motif.isBlank() ? "" : " — " + truncate(motif, 120));

            log.info("[History] Intervention admin sur ticket #{} — retard={}", ticketId, retard);

        } else if (isAdminReassign) {
            // ── Réassignation admin SLA ────────────────────────────
            // La réassignation elle-même est tracée par assignTicket() → REASSIGNED
            action = ActionType.ADMIN_INTERVENTION;
            oldVal = null;
            String motif  = extractMotif(content);
            String retard = extractRetard(content);
            newVal = "Réassignation suite SLA dépassé de " + retard
                    + (motif.isBlank() ? "" : " — Motif : " + truncate(motif, 100));

            log.info("[History] Réassignation admin sur ticket #{} — retard={}", ticketId, retard);

        } else if (request.isInterne()) {
            // ── Note interne classique ─────────────────────────────
            action = ActionType.NOTE_INTERNE_ADDED;
            oldVal = null;
            newVal = truncate(content, 80);

        } else {
            // ── Commentaire public ─────────────────────────────────
            action = ActionType.COMMENT_ADDED;
            oldVal = null;
            newVal = truncate(content, 80);
        }

        // ── 5. Enregistrement dans l'historique ────────────────────
        ticketHistoryService.record(ticket, author, action, oldVal, newVal);

        // ── 6. Notification email (commentaires publics uniquement) ─
        if (!request.isInterne() && action == ActionType.COMMENT_ADDED) {
            try {
                notificationService.notifierNouveauCommentaire(ticket, saved);
            } catch (Exception e) {
                log.warn("[Comment] Email commentaire non envoyé sur ticket #{} : {}",
                        ticketId, e.getMessage());
            }
        }

        return toResponse(saved);
    }

    // ════════════════════════════════════════════════════════════════
    //  LECTURE
    // ════════════════════════════════════════════════════════════════
    public List<CommentResponse> getByTicket(Long ticketId) {
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ════════════════════════════════════════════════════════════════
    //  UTILITAIRES PRIVÉS
    // ════════════════════════════════════════════════════════════════

    /**
     * Extrait le retard depuis un préfixe :
     * "[INTERVENTION ADMIN — SLA dépassé de 3h 20m]\n\n..."
     * "[RÉASSIGNATION ADMIN — SLA dépassé de 1h]\n\n..."
     */
    private String extractRetard(String content) {
        try {
            String marker = "dépassé de ";
            int start = content.indexOf(marker);
            if (start < 0) return "—";
            start += marker.length();
            int end = content.indexOf("]", start);
            if (end <= start) return "—";
            return content.substring(start, end).trim();
        } catch (Exception ignored) {
            return "—";
        }
    }

    /**
     * Extrait le motif situé après le double saut de ligne.
     * Ex : "[INTERVENTION ADMIN — SLA dépassé de 3h 20m]\n\nMotif ici"
     */
    private String extractMotif(String content) {
        try {
            if (content != null && content.contains("\n\n")) {
                return content.substring(content.indexOf("\n\n") + 2).trim();
            }
        } catch (Exception ignored) {}
        return "";
    }

    private String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() > max ? s.substring(0, max - 1) + "…" : s;
    }

    private CommentResponse toResponse(Comment c) {
        return CommentResponse.builder()
                .id(c.getId())
                .content(c.getContent())
                .ticketId(c.getTicket().getId())
                .authorEmail(c.getAuthor().getEmail())
                .authorName(c.getAuthor().getFirstName() + " " + c.getAuthor().getLastName())
                .createdAt(c.getCreatedAt())
                .interne(c.isInterne())
                .build();
    }
}