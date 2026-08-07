package com.helpdesk.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketHistoryResponse {

    private Long   id;
    private String action;        // nom de l'enum ex: STATUS_CHANGED
    private String actionLabel;   // libellé français ex: "Statut modifié"
    private String oldValue;
    private String newValue;
    private LocalDateTime createdAt;
    private ActorInfo performedBy;

    // ── Champ dédié pour les pièces jointes ───────────────────────
    // Rempli uniquement quand action == ATTACHMENT_ADDED
    // Permet au frontend d'afficher un bouton "Ouvrir" cliquable
    private Long   attachmentId;   // ID de l'attachment → /api/tickets/{ticketId}/attachments/{attachmentId}/download
    private String attachmentName; // Nom du fichier affiché dans l'historique

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActorInfo {
        private Long   id;
        private String firstName;
        private String lastName;
        private String role;
    }
}