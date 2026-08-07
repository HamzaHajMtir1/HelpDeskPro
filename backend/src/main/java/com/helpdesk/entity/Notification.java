package com.helpdesk.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String titre;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    // TICKET_ASSIGNE | SLA_WARNING | SLA_BREACH | NOUVEAU_COMMENTAIRE
    // TICKET_RESOLU  | INFO_REQUISE | TICKET_NON_ASSIGNE | ESCALADE
    @Column(nullable = false)
    private String type;

    // ID du ticket concerné — pour que le front puisse rediriger
    private Long ticketId;

    @Column(nullable = false)
    @Builder.Default
    private boolean lu = false;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}