package com.helpdesk.service;

import com.helpdesk.dto.TicketHistoryResponse;
import com.helpdesk.entity.Ticket;
import com.helpdesk.entity.TicketHistory;
import com.helpdesk.entity.TicketHistory.ActionType;
import com.helpdesk.entity.User;
import com.helpdesk.repository.TicketHistoryRepository;
import com.helpdesk.repository.TicketRepository;
import com.helpdesk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketHistoryService {

    private final TicketHistoryRepository historyRepository;
    private final TicketRepository        ticketRepository;
    private final UserRepository          userRepository;

    // ════════════════════════════════════════════════════════════════
    //  LABELS FRANÇAIS
    // ════════════════════════════════════════════════════════════════
    private static final Map<ActionType, String> LABELS = Map.ofEntries(
            Map.entry(ActionType.TICKET_CREATED,      "Ticket créé"),
            Map.entry(ActionType.TICKET_UPDATED,      "Ticket modifié"),
            Map.entry(ActionType.TICKET_RESOLVED,     "Ticket résolu"),
            Map.entry(ActionType.TICKET_CLOSED,       "Ticket clôturé"),
            Map.entry(ActionType.STATUS_CHANGED,      "Statut modifié"),
            Map.entry(ActionType.PRIORITY_CHANGED,    "Priorité modifiée"),
            Map.entry(ActionType.CATEGORY_CHANGED,    "Catégorie modifiée"),
            Map.entry(ActionType.ASSIGNED,            "Ticket assigné"),
            Map.entry(ActionType.UNASSIGNED,          "Assignation retirée"),
            Map.entry(ActionType.REASSIGNED,          "Ticket réassigné"),
            Map.entry(ActionType.SLA_BREACHED,        "SLA dépassé"),
            Map.entry(ActionType.SLA_ESCALATED,       "Escalade automatique SLA"),
            Map.entry(ActionType.SLA_RESET,           "SLA réinitialisé"),
            Map.entry(ActionType.COMMENT_ADDED,       "Message envoyé"),
            Map.entry(ActionType.NOTE_INTERNE_ADDED,  "Note interne ajoutée"),
            Map.entry(ActionType.ATTACHMENT_ADDED,    "Pièce jointe ajoutée"),
            Map.entry(ActionType.ADMIN_INTERVENTION,  "Intervention admin — SLA dépassé")
    );

    // ════════════════════════════════════════════════════════════════
    //  RÈGLES DE VISIBILITÉ PAR RÔLE
    // ════════════════════════════════════════════════════════════════

    /** Actions visibles par le CLIENT */
    private static final Set<ActionType> CLIENT_VISIBLE = Set.of(
            ActionType.TICKET_CREATED,
            ActionType.TICKET_UPDATED,
            ActionType.TICKET_RESOLVED,
            ActionType.TICKET_CLOSED,
            ActionType.STATUS_CHANGED,
            ActionType.COMMENT_ADDED,
            ActionType.ATTACHMENT_ADDED
    );

    // ════════════════════════════════════════════════════════════════
    //  ENREGISTREMENT
    // ════════════════════════════════════════════════════════════════

    @Transactional
    public void record(Ticket ticket, User performedBy,
                       ActionType action,
                       String oldValue, String newValue) {
        TicketHistory entry = TicketHistory.builder()
                .ticket(ticket)
                .performedBy(performedBy)
                .action(action)
                .oldValue(oldValue)
                .newValue(newValue)
                .build();
        historyRepository.save(entry);
        log.debug("[History] Ticket #{} | {} | {} → {}",
                ticket.getId(), action, oldValue, newValue);
    }

    @Transactional
    public void record(Ticket ticket, User performedBy, ActionType action) {
        record(ticket, performedBy, action, null, null);
    }

    // ════════════════════════════════════════════════════════════════
    //  RÉCUPÉRATION FILTRÉE PAR RÔLE
    // ════════════════════════════════════════════════════════════════

    public List<TicketHistoryResponse> getHistory(Long ticketId, String callerEmail) {

        User caller = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + callerEmail));

        List<TicketHistory> all = historyRepository
                .findByTicketIdOrderByCreatedAtAsc(ticketId);

        return all.stream()
                .filter(h -> isVisible(h, caller))
                .map(h  -> toResponse(h, caller))
                .collect(Collectors.toList());
    }

    // ════════════════════════════════════════════════════════════════
    //  VISIBILITÉ
    // ════════════════════════════════════════════════════════════════

    private boolean isVisible(TicketHistory h, User caller) {
        switch (caller.getRole()) {
            case ADMIN:
                return true;
            case TECHNICIEN:
                if (h.getAction() == ActionType.NOTE_INTERNE_ADDED) {
                    return h.getPerformedBy().getId().equals(caller.getId());
                }
                return true;
            case CLIENT:
            default:
                return CLIENT_VISIBLE.contains(h.getAction());
        }
    }

    // ════════════════════════════════════════════════════════════════
    //  MAPPING → DTO
    // ════════════════════════════════════════════════════════════════

    private TicketHistoryResponse toResponse(TicketHistory h, User caller) {

        String label = LABELS.getOrDefault(h.getAction(), h.getAction().name());

        // ── Label adapté au rôle ───────────────────────────────────
        if (h.getAction() == ActionType.ADMIN_INTERVENTION) {
            label = caller.getRole() == User.Role.TECHNICIEN
                    ? "Intervention de l'administrateur"
                    : "Intervention admin — SLA dépassé";
        }

        if (h.getAction() == ActionType.COMMENT_ADDED
                && caller.getRole() == User.Role.CLIENT) {
            boolean byClient = h.getPerformedBy().getRole() == User.Role.CLIENT;
            label = byClient ? "Vous avez envoyé un message" : "Réponse du support";
        }

        if (h.getAction() == ActionType.ATTACHMENT_ADDED
                && caller.getRole() == User.Role.CLIENT) {
            boolean byClient = h.getPerformedBy().getRole() == User.Role.CLIENT;
            label = byClient ? "Vous avez joint un fichier" : "Fichier ajouté par le support";
        }

        // ── Parse attachmentId:fileName depuis newValue ────────────
        // Format stocké dans newValue : "123:rapport.pdf"
        // Pour les anciens enregistrements (avant la migration),
        // newValue contient juste le nom → pas d'attachmentId, pas de bouton.
        Long   attachmentId   = null;
        String attachmentName = null;
        String displayNewValue = h.getNewValue();

        if (h.getAction() == ActionType.ATTACHMENT_ADDED && h.getNewValue() != null) {
            String raw = h.getNewValue();
            int colonIdx = raw.indexOf(':');
            if (colonIdx > 0) {
                // Nouveau format : "123:rapport.pdf"
                try {
                    attachmentId   = Long.parseLong(raw.substring(0, colonIdx));
                    attachmentName = raw.substring(colonIdx + 1);
                    displayNewValue = attachmentName; // afficher juste le nom dans l'UI
                } catch (NumberFormatException e) {
                    // Ancien format : juste le nom de fichier
                    attachmentName = raw;
                    displayNewValue = raw;
                }
            } else {
                // Ancien format : juste le nom de fichier
                attachmentName = raw;
                displayNewValue = raw;
            }
        }

        return TicketHistoryResponse.builder()
                .id(h.getId())
                .action(h.getAction().name())
                .actionLabel(label)
                .oldValue(h.getOldValue())
                .newValue(displayNewValue)
                .createdAt(h.getCreatedAt())
                .attachmentId(attachmentId)
                .attachmentName(attachmentName)
                .performedBy(TicketHistoryResponse.ActorInfo.builder()
                        .id(h.getPerformedBy().getId())
                        .firstName(h.getPerformedBy().getFirstName())
                        .lastName(h.getPerformedBy().getLastName())
                        .role(h.getPerformedBy().getRole().name())
                        .build())
                .build();
    }
}