package com.helpdesk.service;

import com.helpdesk.dto.NotificationResponse;
import com.helpdesk.entity.Comment;
import com.helpdesk.entity.Notification;
import com.helpdesk.entity.Ticket;
import com.helpdesk.entity.User;
import com.helpdesk.repository.NotificationRepository;
import com.helpdesk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final EmailService           emailService;
    private final NotificationRepository notificationRepository;
    private final UserRepository         userRepository;

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private String fullName(User u) { return u.getFirstName() + " " + u.getLastName(); }
    private String ref(Ticket t)    { return "#TKT-" + String.format("%03d", t.getId()); }

    private void creerNotification(User user, String titre, String message,
                                   String type, Long ticketId, boolean adminOnly) {
        if (adminOnly && user.getRole() != User.Role.ADMIN) return;
        Notification notif = Notification.builder()
                .user(user)
                .titre(titre)
                .message(message)
                .type(type)
                .ticketId(ticketId)
                .lu(false)
                .build();
        notificationRepository.save(notif);
    }

    private void creerNotification(User user, String titre, String message,
                                   String type, Long ticketId) {
        creerNotification(user, titre, message, type, ticketId, false);
    }

    private List<User> getAdmins() {
        return userRepository.findByRole(User.Role.ADMIN)
                .stream()
                .filter(User::isEnabled)
                .collect(Collectors.toList());
    }

    // ════════════════════════════════════════════════════════
    //  READ
    // ════════════════════════════════════════════════════════
    public List<NotificationResponse> getMesNotifications(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(NotificationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public long getNombreNonLues(User user) {
        return notificationRepository.countByUserAndLuFalse(user);
    }

    @Transactional
    public void marquerLue(Long notifId, User user) {
        Notification notif = notificationRepository.findById(notifId)
                .orElseThrow(() -> new RuntimeException("Notification introuvable"));
        if (!notif.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Acces refuse");
        notif.setLu(true);
        notificationRepository.save(notif);
    }

    @Transactional
    public void marquerToutesLues(User user) {
        notificationRepository.marquerToutesLues(user);
    }

    // ════════════════════════════════════════════════════════
    //  1. Nouveau compte
    // ════════════════════════════════════════════════════════
    public void notifierNouveauCompte(User user, String tempPassword) {
        emailService.sendCredentials(user.getEmail(), fullName(user), tempPassword);
    }

    // ════════════════════════════════════════════════════════
    //  2. Ticket créé
    // ════════════════════════════════════════════════════════
    public void notifierTicketCree(Ticket ticket) {
        User client = ticket.getCreatedBy();

        creerNotification(client,
                "Ticket créé avec succès",
                "Votre ticket " + ref(ticket) + " - \"" + ticket.getTitle()
                        + "\" a bien été enregistré.",
                "TICKET_CREE", ticket.getId());

        boolean isCritique = ticket.getPriority() != null &&
                "Critique".equalsIgnoreCase(ticket.getPriority().getName());

        if (isCritique) {
            getAdmins().forEach(admin ->
                    creerNotification(admin,
                            "🚨 Ticket critique créé",
                            "Un ticket CRITIQUE " + ref(ticket) + " - \""
                                    + ticket.getTitle() + "\" vient d'être soumis par "
                                    + fullName(client) + ".",
                            "TICKET_CREE", ticket.getId(), true)
            );
        }
    }

    // ════════════════════════════════════════════════════════
    //  3. Ticket assigné
    // ════════════════════════════════════════════════════════
    public void notifierTicketAssigne(Ticket ticket) {
        User tech = ticket.getAssignedTo();
        if (tech == null) return;

        String slaDeadline = ticket.getSlaDeadline() != null
                ? ticket.getSlaDeadline().format(DATE_FMT) : "Non définie";

        creerNotification(tech,
                "Nouveau ticket assigné",
                "Le ticket " + ref(ticket) + " - \"" + ticket.getTitle()
                        + "\" vous a été assigné. SLA : " + slaDeadline,
                "TICKET_ASSIGNE", ticket.getId());

        try {
            emailService.sendTicketAssigne(
                    tech.getEmail(), fullName(tech),
                    ref(ticket), ticket.getTitle(),
                    ticket.getPriority().getName(),
                    ticket.getCategory().getName(),
                    fullName(ticket.getCreatedBy()),
                    slaDeadline);
        } catch (Exception e) {
            log.error("Email assignation non envoyé : {}", e.getMessage());
        }
    }

    // ════════════════════════════════════════════════════════
    //  4. Information requise
    // ════════════════════════════════════════════════════════
    public void notifierInfoRequise(Ticket ticket) {
        User client = ticket.getCreatedBy();
        String techName = ticket.getAssignedTo() != null
                ? ticket.getAssignedTo().getFirstName() : "Un technicien";

        creerNotification(client,
                "Information requise",
                "Le technicien " + techName + " a besoin d'une information sur votre ticket "
                        + ref(ticket) + " - \"" + ticket.getTitle() + "\".",
                "INFO_REQUISE", ticket.getId());

        try {
            emailService.sendInfoRequise(
                    client.getEmail(), fullName(client),
                    ref(ticket), ticket.getTitle(), techName);
        } catch (Exception e) {
            log.error("Email info requise non envoyé : {}", e.getMessage());
        }
    }

    // ════════════════════════════════════════════════════════
    //  5. Ticket résolu
    // ════════════════════════════════════════════════════════
    public void notifierTicketResolu(Ticket ticket) {
        User client = ticket.getCreatedBy();
        String techName = ticket.getAssignedTo() != null
                ? ticket.getAssignedTo().getFirstName() : "Le technicien";

        creerNotification(client,
                "Ticket résolu",
                "Votre ticket " + ref(ticket) + " - \"" + ticket.getTitle()
                        + "\" a été résolu par " + techName + ".",
                "TICKET_RESOLU", ticket.getId());

        try {
            emailService.sendTicketResolu(
                    client.getEmail(), fullName(client),
                    ref(ticket), ticket.getTitle(), techName);
        } catch (Exception e) {
            log.error("Email résolu non envoyé : {}", e.getMessage());
        }
    }

    // ════════════════════════════════════════════════════════
    //  6. Ticket clôturé
    // ════════════════════════════════════════════════════════
    public void notifierTicketCloture(Ticket ticket) {
        User client = ticket.getCreatedBy();

        creerNotification(client,
                "Ticket clôturé",
                "Votre ticket " + ref(ticket) + " - \"" + ticket.getTitle()
                        + "\" a été clôturé. Merci d'avoir utilisé notre support.",
                "TICKET_CLOTURE", ticket.getId());

        getAdmins().forEach(admin ->
                creerNotification(admin,
                        "Ticket clôturé",
                        "Le ticket " + ref(ticket) + " - \"" + ticket.getTitle()
                                + "\" a été clôturé par "
                                + (ticket.getAssignedTo() != null ? fullName(ticket.getAssignedTo()) : "système") + ".",
                        "TICKET_CLOTURE", ticket.getId(), true)
        );
    }

    // ════════════════════════════════════════════════════════
    //  7. Nouveau commentaire
    // ════════════════════════════════════════════════════════
    public void notifierNouveauCommentaire(Ticket ticket, Comment comment) {
        if (comment.isInterne()) return;

        User auteur = comment.getAuthor();
        User destinataire;

        switch (auteur.getRole()) {
            case CLIENT     -> destinataire = ticket.getAssignedTo();
            case TECHNICIEN -> destinataire = ticket.getCreatedBy();
            default         -> { return; }
        }

        if (destinataire == null) return;

        String apercu = comment.getContent().length() > 80
                ? comment.getContent().substring(0, 80) + "..."
                : comment.getContent();

        creerNotification(destinataire,
                "Nouveau message de " + auteur.getFirstName(),
                "Sur le ticket " + ref(ticket) + " : \"" + apercu + "\"",
                "NOUVEAU_COMMENTAIRE", ticket.getId());

        try {
            emailService.sendNouveauCommentaire(
                    destinataire.getEmail(), fullName(destinataire),
                    ref(ticket), ticket.getTitle(),
                    fullName(auteur), apercu);
        } catch (Exception e) {
            log.error("Email commentaire non envoyé : {}", e.getMessage());
        }
    }

    // ════════════════════════════════════════════════════════
    //  8. SLA Warning
    // ════════════════════════════════════════════════════════
    public void notifierSlaWarning(Ticket ticket, String tempsRestant) {
        User tech = ticket.getAssignedTo();
        String deadline = ticket.getSlaDeadline() != null
                ? ticket.getSlaDeadline().format(DATE_FMT) : "Non définie";

        if (tech != null) {
            creerNotification(tech,
                    "SLA bientôt dépassé",
                    "Le ticket " + ref(ticket) + " - \"" + ticket.getTitle()
                            + "\" doit être traité dans " + tempsRestant
                            + ". Deadline : " + deadline,
                    "SLA_WARNING", ticket.getId());

            try {
                emailService.sendSlaWarning(
                        tech.getEmail(), fullName(tech),
                        ref(ticket), ticket.getTitle(), deadline, tempsRestant);
            } catch (Exception e) {
                log.error("Email SLA warning tech non envoyé : {}", e.getMessage());
            }
        }

        getAdmins().forEach(admin ->
                creerNotification(admin,
                        "⚠️ SLA à risque",
                        "Le ticket " + ref(ticket) + " - \"" + ticket.getTitle()
                                + "\" approche sa deadline SLA dans " + tempsRestant
                                + (tech != null ? ". Assigné à : " + fullName(tech) : ". Non assigné !"),
                        "SLA_WARNING", ticket.getId(), true)
        );
    }

    // ════════════════════════════════════════════════════════
    //  9. SLA Breach
    // ════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════
//  Dans NotificationService.java — remplacer notifierSlaBreach()
//  Ajout : isAdmin=true dans l'appel email pour les admins
// ════════════════════════════════════════════════════════

    public void notifierSlaBreach(Ticket ticket, User admin) {
        String deadline = ticket.getSlaDeadline() != null
                ? ticket.getSlaDeadline().format(DATE_FMT) : "Non définie";

        String msgBase = "Le SLA du ticket " + ref(ticket) + " - \""
                + ticket.getTitle() + "\" a été dépassé. Deadline était : " + deadline;

        // ── Technicien assigné ───────────────────────────────────────
        User tech = ticket.getAssignedTo();
        if (tech != null) {
            creerNotification(tech, "🚨 SLA dépassé", msgBase, "SLA_BREACH", ticket.getId());
            try {
                emailService.sendSlaBreach(
                        tech.getEmail(), fullName(tech),
                        ref(ticket), ticket.getTitle(),
                        deadline,
                        false);  // ← isAdmin = false → email technicien
            } catch (Exception e) {
                log.error("Email SLA breach tech non envoyé : {}", e.getMessage());
            }
        }

        // ── Admins : message + lien intervention ────────────────────
        getAdmins().forEach(a -> {
            String msgAdmin = msgBase
                    + (tech != null
                    ? " Technicien assigné : " + fullName(tech) + ". Vous pouvez intervenir depuis la page SLA."
                    : " ⚠️ Aucun technicien assigné — escalade requise.");

            creerNotification(a,
                    "🚨 SLA dépassé — Intervention requise",
                    msgAdmin,
                    "SLA_BREACH", ticket.getId(), true);
            try {
                emailService.sendSlaBreach(
                        a.getEmail(), fullName(a),
                        ref(ticket), ticket.getTitle(),
                        deadline,
                        true);  // ← isAdmin = true → email admin avec bouton Intervenir
            } catch (Exception e) {
                log.error("Email SLA breach admin non envoyé : {}", e.getMessage());
            }
        });
    }

    // ════════════════════════════════════════════════════════
    //  10. Ticket non assigné
    // ════════════════════════════════════════════════════════
    public void notifierTicketNonAssigne(Ticket ticket, User admin, long delayMinutes) {
        String createdAt = ticket.getCreatedAt() != null
                ? ticket.getCreatedAt().format(DATE_FMT) : "Inconnue";

        getAdmins().forEach(a ->
                creerNotification(a,
                        "⏰ Ticket non assigné",
                        "Le ticket " + ref(ticket) + " - \"" + ticket.getTitle()
                                + "\" n'a pas été pris en charge depuis "
                                + delayMinutes + " minutes. Créé le " + createdAt + ".",
                        "TICKET_NON_ASSIGNE", ticket.getId(), true)
        );

        if (admin != null) {
            try {
                emailService.sendSlaUnassigned(admin.getEmail(), fullName(admin),
                        ref(ticket), ticket.getTitle(), createdAt, delayMinutes);
            } catch (Exception e) {
                log.error("Email ticket non assigné non envoyé : {}", e.getMessage());
            }
        }
    }

    // ════════════════════════════════════════════════════════
    //  11. Escalade
    // ════════════════════════════════════════════════════════
    public void notifierEscalade(Ticket ticket) {
        User tech = ticket.getAssignedTo();

        if (tech != null) {
            creerNotification(tech,
                    "Ticket en escalade",
                    "Le ticket " + ref(ticket) + " - \"" + ticket.getTitle()
                            + "\" vous a été assigné en escalade SLA. Traitez-le en urgence.",
                    "ESCALADE", ticket.getId());

            try {
                emailService.sendEscaladeNotification(
                        tech.getEmail(), fullName(tech),
                        ticket.getId(), ticket.getTitle(),
                        ticket.getPriority().getName(),
                        ticket.getCategory().getName());
            } catch (Exception e) {
                log.error("Email escalade non envoyé : {}", e.getMessage());
            }
        }

        getAdmins().forEach(admin ->
                creerNotification(admin,
                        "🔺 Escalade SLA",
                        "Le ticket " + ref(ticket) + " - \"" + ticket.getTitle()
                                + "\" a été escaladé et assigné à "
                                + (tech != null ? fullName(tech) : "aucun technicien") + ".",
                        "ESCALADE", ticket.getId(), true)
        );
    }
}