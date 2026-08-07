package com.helpdesk.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by_id", nullable = false)
    private User performedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActionType action;

    @Column(name = "old_value")
    private String oldValue;

    @Column(name = "new_value")
    private String newValue;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public enum ActionType {
        // ── Cycle de vie ──────────────────────────────
        TICKET_CREATED,
        TICKET_UPDATED,
        TICKET_RESOLVED,
        TICKET_CLOSED,

        // ── Statut ────────────────────────────────────
        STATUS_CHANGED,

        // ── Priorité / Catégorie ──────────────────────
        PRIORITY_CHANGED,
        CATEGORY_CHANGED,

        // ── Assignation ───────────────────────────────
        ASSIGNED,
        UNASSIGNED,
        REASSIGNED,

        // ── SLA ───────────────────────────────────────
        SLA_BREACHED,
        SLA_ESCALATED,
        SLA_RESET,

        // ── Échanges ──────────────────────────────────
        COMMENT_ADDED,
        NOTE_INTERNE_ADDED,
        ATTACHMENT_ADDED,

        // ── Intervention admin SLA (NOUVEAU) ──────────
        // Enregistré quand un admin utilise le bouton "Intervenir"
        // (commenter ou réassigner depuis la page AdminSla)
        // Visible : TECH + ADMIN — masqué au CLIENT
        ADMIN_INTERVENTION,
    }
}