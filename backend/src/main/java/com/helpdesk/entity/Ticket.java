package com.helpdesk.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.helpdesk.entity.Comment;

@Entity
@Table(name = "tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(exclude = {"attachments", "history"})
@ToString(exclude = {"attachments", "history"})
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    // ── Commentaire épinglé comme solution ────────────────────────
    @Column(name = "solution_comment_id")
    private Long solutionCommentId;

    // ── Pièces jointes épinglées comme solution ───────────────────
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "solution_attachment_ids", columnDefinition = "TEXT")
    @Builder.Default
    private List<Long> solutionAttachmentIds = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "priority_id", nullable = false)
    private Priority priority;

    @ManyToOne
    @JoinColumn(name = "status_id", nullable = false)
    private TicketStatus status;

    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @ManyToOne
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    public enum TicketType {
        INCIDENT, DEMANDE
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private TicketType type;

    // ── SLA résolution ─────────────────────────────────────────────
    @Column(name = "sla_deadline")
    private LocalDateTime slaDeadline;

    @Column(name = "sla_total_minutes")
    private Integer slaTotalMinutes;

    @Column(name = "sla_warning_email_sent", nullable = false)
    @Builder.Default
    private boolean slaWarningEmailSent = false;

    @Column(name = "sla_breached_email_sent", nullable = false)
    @Builder.Default
    private boolean slaBreachedEmailSent = false;

    // ── SLA première prise en charge ───────────────────────────────
    @Column(name = "sla_unassigned_email_sent", nullable = false)
    @Builder.Default
    private boolean slaUnassignedEmailSent = false;

    // ── Flag escalade automatique — évite la boucle infinie ───────
    @Column(name = "sla_escalade_effectuee", nullable = false)
    @Builder.Default
    private boolean slaEscaladeEffectuee = false;

    // ── Phase SLA courante ─────────────────────────────────────────
    // Valeurs : "PRISE_EN_CHARGE" | "TRAITEMENT" | null
    @Column(name = "sla_phase", length = 50)
    @Builder.Default
    private String slaPhase = "PRISE_EN_CHARGE";

    // ── SLA dépassé ────────────────────────────────────────────────
    @Column(name = "sla_breached", nullable = false)
    @Builder.Default
    private boolean slaBreached = false;

    // ── Nombre d'escalades automatiques ───────────────────────────
    @Column(name = "escalade_count", nullable = false)
    @Builder.Default
    private int escaladeCount = 0;

    // ── Temps de résolution en minutes ────────────────────────────
    // Rempli par le service quand le ticket passe en statut final
    @Column(name = "resolution_minutes")
    private Long resolutionMinutes;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Attachment> attachments = new ArrayList<>();

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TicketHistory> history = new ArrayList<>();

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}