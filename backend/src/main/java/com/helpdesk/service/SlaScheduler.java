package com.helpdesk.service;

import com.helpdesk.entity.Ticket;
import com.helpdesk.entity.TicketHistory.ActionType;
import com.helpdesk.entity.User;
import com.helpdesk.repository.TicketRepository;
import com.helpdesk.repository.TicketStatusRepository;
import com.helpdesk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Scheduler SLA — conforme ITIL v4
 *
 * SLA 1 — Délai de résolution (tickets assignés)
 *   • WARNING  à 80% du temps écoulé → notif tech + admins (une seule fois)
 *   • BREACH   à 100% deadline dépassée → notif tech + tous admins (une seule fois)
 *              → email admin avec bouton "Intervenir" (isAdmin=true)
 *
 * SLA 2 — Délai de prise en charge (tickets non assignés)
 *   • ALERTE   si slaDeadline dépassée → email + notif admins (une seule fois)
 *   • ESCALADE automatique vers tech le moins chargé de la catégorie (une seule fois via flag)
 *              → escaladeCount incrémenté à chaque escalade
 *
 * Cycle : toutes les 5 minutes
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SlaScheduler {

    private final TicketRepository       ticketRepository;
    private final UserRepository         userRepository;
    private final TicketStatusRepository ticketStatusRepository;
    private final EmailService           emailService;
    private final NotificationService    notificationService;
    private final TicketHistoryService   ticketHistoryService;

    private static final DateTimeFormatter FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    // ════════════════════════════════════════════════════════════════
    //  POINT D'ENTRÉE — toutes les 5 minutes
    // ════════════════════════════════════════════════════════════════
    @Scheduled(fixedRate = 5 * 60 * 1000)
    @Transactional
    public void checkSla() {
        LocalDateTime now = LocalDateTime.now();
        log.info("[SLA] ── Vérification lancée à {} ──", now.format(FORMAT));
        checkSlaResolution(now);
        checkSlaPriseEnCharge(now);
        log.info("[SLA] ── Vérification terminée ──");
    }

    // ════════════════════════════════════════════════════════════════
    //  SLA 1 — Résolution (tickets assignés, deadline dans les 24h)
    // ════════════════════════════════════════════════════════════════
    private void checkSlaResolution(LocalDateTime now) {
        List<Ticket> ticketsAtRisk = ticketRepository
                .findTicketsAtRiskBefore(now.plusHours(24));

        log.info("[SLA-1] {} ticket(s) en phase TRAITEMENT à surveiller", ticketsAtRisk.size());

        for (Ticket ticket : ticketsAtRisk) {
            LocalDateTime deadline = ticket.getSlaDeadline();
            if (deadline == null) continue;

            long totalMinutes     = ticket.getPriority().getSlaHours() * 60L;
            long remainingMinutes = Duration.between(now, deadline).toMinutes();
            if (totalMinutes <= 0) continue;

            boolean isBreached = now.isAfter(deadline);
            double  pctElapsed = 1.0 - ((double) remainingMinutes / totalMinutes);
            boolean isWarning  = !isBreached && pctElapsed >= 0.80;

            // Marque slaBreached en base (flag persistant)
            if (isBreached && !ticket.isSlaBreached()) {
                ticket.setSlaBreached(true);
                ticketRepository.save(ticket);
            }

            if (isBreached && !ticket.isSlaBreachedEmailSent()) {
                // ✅ Email breach : tech (isAdmin=false) + tous admins (isAdmin=true)
                sendBreachEmail(ticket);
                notificationService.notifierSlaBreach(ticket, null);
                ticket.setSlaBreachedEmailSent(true);
                ticketRepository.save(ticket);
                log.warn("[SLA-1] 🚨 BREACH — Ticket #{} «{}» | deadline était: {}",
                        ticket.getId(), ticket.getTitle(), deadline.format(FORMAT));

            } else if (isWarning && !ticket.isSlaWarningEmailSent()) {
                String tempsRestant = formatDuree(remainingMinutes);
                sendWarningEmail(ticket, remainingMinutes);
                notificationService.notifierSlaWarning(ticket, tempsRestant);
                ticket.setSlaWarningEmailSent(true);
                ticketRepository.save(ticket);
                log.info("[SLA-1] ⚠️ WARNING — Ticket #{} «{}» | reste: {}",
                        ticket.getId(), ticket.getTitle(), tempsRestant);
            }
        }
    }

    // ════════════════════════════════════════════════════════════════
    //  SLA 2 — Prise en charge (tickets non assignés)
    // ════════════════════════════════════════════════════════════════
    private void checkSlaPriseEnCharge(LocalDateTime now) {
        List<Ticket> unassigned = ticketRepository.findUnassignedAndNotFinal();

        log.info("[SLA-2] {} ticket(s) non assigné(s)", unassigned.size());

        for (Ticket ticket : unassigned) {
            LocalDateTime deadline = ticket.getSlaDeadline();

            if (deadline == null) {
                log.warn("[SLA-2] Ticket #{} sans slaDeadline — ignoré", ticket.getId());
                continue;
            }

            boolean seuilDepasse = now.isAfter(deadline);

            log.info("[SLA-2] Ticket #{} «{}» | deadline prise en charge: {} | dépassée: {}",
                    ticket.getId(), ticket.getTitle(), deadline.format(FORMAT), seuilDepasse);

            if (!seuilDepasse) continue;

            // Alerte admins — une seule fois
            if (!ticket.isSlaUnassignedEmailSent()) {
                sendUnassignedEmail(ticket);
                notificationService.notifierTicketNonAssigne(
                        ticket, null, ticket.getPriority().getEscaladeMinutes());
                ticket.setSlaUnassignedEmailSent(true);
                ticketRepository.save(ticket);
                log.warn("[SLA-2] ⏰ NON PRIS EN CHARGE — Ticket #{} «{}» | priorité: {}",
                        ticket.getId(), ticket.getTitle(), ticket.getPriority().getName());
            }

            // Escalade automatique — une seule fois via flag
            if (!ticket.isSlaEscaladeEffectuee()) {
                escaladerAutomatiquement(ticket, now);
            } else {
                log.debug("[SLA-2] Ticket #{} déjà escaladé — skip", ticket.getId());
            }
        }
    }

    // ════════════════════════════════════════════════════════════════
    //  ESCALADE AUTOMATIQUE
    //
    //  Logique de sélection du technicien :
    //  1. Techs spécialisés dans la CATÉGORIE du ticket (priorité)
    //     Si un seul tech dans cette catégorie → on lui assigne directement
    //     (pas de concurrence, escalade logique même si c'est le seul)
    //  2. Fallback : tous les techs actifs (si aucun spécialisé)
    //  3. Parmi les candidats → le moins chargé (tickets actifs non finaux)
    //  4. escaladeCount incrémenté + flag anti-boucle posé
    // ════════════════════════════════════════════════════════════════
    private void escaladerAutomatiquement(Ticket ticket, LocalDateTime now) {
        try {
            log.info("[SLA-2 ESCALADE] Ticket #{} «{}» (cat: {})",
                    ticket.getId(), ticket.getTitle(),
                    ticket.getCategory() != null ? ticket.getCategory().getName() : "—");

            // 1. Techs spécialisés dans la catégorie du ticket
            List<User> candidats = ticket.getCategory() != null
                    ? userRepository.findByRoleAndSpecialtyCategory_Id(
                            User.Role.TECHNICIEN,
                            ticket.getCategory().getId())
                    .stream().filter(User::isEnabled).collect(Collectors.toList())
                    : List.of();

            log.info("[SLA-2 ESCALADE] {} tech(s) spécialisé(s) en catégorie «{}»",
                    candidats.size(),
                    ticket.getCategory() != null ? ticket.getCategory().getName() : "—");

            // 2. Fallback : tous les techs actifs si aucun spécialisé
            if (candidats.isEmpty()) {
                candidats = userRepository.findByRole(User.Role.TECHNICIEN)
                        .stream().filter(User::isEnabled).collect(Collectors.toList());
                log.info("[SLA-2 ESCALADE] Fallback tous techs actifs : {} candidat(s)",
                        candidats.size());
            }

            if (candidats.isEmpty()) {
                log.error("[SLA-2 ESCALADE] ❌ Aucun technicien disponible — ticket #{}",
                        ticket.getId());
                return;
            }

            // 3. Tech le moins chargé parmi les candidats
            User technicien = candidats.stream()
                    .min(Comparator.comparingLong(u ->
                            ticketRepository.countByAssignedToAndStatus_FinalStatusFalse(u)))
                    .orElse(null);

            if (technicien == null) {
                log.error("[SLA-2 ESCALADE] ❌ Sélection impossible — ticket #{}", ticket.getId());
                return;
            }

            long charge = ticketRepository.countByAssignedToAndStatus_FinalStatusFalse(technicien);
            log.info("[SLA-2 ESCALADE] Tech sélectionné : {} {} (charge: {} tickets actifs)",
                    technicien.getFirstName(), technicien.getLastName(), charge);

            // 4. Statut "En cours"
            var enCours = ticketStatusRepository
                    .findByActiveTrueOrderByDisplayOrderAsc().stream()
                    .filter(s -> s.getName().toLowerCase().contains("cours"))
                    .findFirst()
                    .orElse(ticket.getStatus());

            // 5. Appliquer l'escalade — reset SLA résolution
            LocalDateTime nouvelleDeadline = now.plusHours(ticket.getPriority().getSlaHours());

            ticket.setAssignedTo(technicien);
            ticket.setStatus(enCours);
            ticket.setSlaDeadline(nouvelleDeadline);
            ticket.setSlaTotalMinutes(ticket.getPriority().getSlaHours() * 60);
            ticket.setSlaPhase("TRAITEMENT");
            ticket.setSlaBreached(false);
            ticket.setSlaWarningEmailSent(false);
            ticket.setSlaBreachedEmailSent(false);
            ticket.setSlaEscaladeEffectuee(true);   // ← flag anti-boucle

            // ✅ FIX : incrémenter le compteur d'escalades
            ticket.setEscaladeCount(ticket.getEscaladeCount() + 1);

            ticketRepository.save(ticket);

            // 6. Historique
            ticketHistoryService.record(
                    ticket, technicien,
                    ActionType.SLA_ESCALATED,
                    "Non assigné",
                    technicien.getFirstName() + " " + technicien.getLastName()
            );

            // 7. Notifications tech + admins
            notificationService.notifierEscalade(ticket);

            log.info("[SLA-2 ESCALADE] ✅ Ticket #{} escaladé → {} {} | escaladeCount={} | deadline résolution: {}",
                    ticket.getId(),
                    technicien.getFirstName(), technicien.getLastName(),
                    ticket.getEscaladeCount(),
                    nouvelleDeadline.format(FORMAT));

        } catch (Exception e) {
            log.error("[SLA-2 ESCALADE] ❌ Erreur ticket #{} : {} | cause: {}",
                    ticket.getId(), e.getMessage(),
                    e.getCause() != null ? e.getCause().getMessage() : "—");
        }
    }

    // ════════════════════════════════════════════════════════════════
    //  EMAILS
    // ════════════════════════════════════════════════════════════════

    /**
     * SLA 1 — Warning 80% → technicien assigné uniquement
     */
    private void sendWarningEmail(Ticket ticket, long remainingMinutes) {
        User tech = ticket.getAssignedTo();
        if (tech == null) return;
        emailService.sendSlaWarning(
                tech.getEmail(),
                tech.getFirstName() + " " + tech.getLastName(),
                "#TKT-" + String.format("%03d", ticket.getId()),
                ticket.getTitle(),
                ticket.getSlaDeadline().format(FORMAT),
                formatDuree(remainingMinutes));
    }

    /**
     * SLA 1 — Breach 100% :
     *   → Technicien (isAdmin=false) : email standard
     *   → Tous les admins (isAdmin=true) : email avec bouton "Intervenir"
     */
    private void sendBreachEmail(Ticket ticket) {
        User tech = ticket.getAssignedTo();
        if (tech == null) return;

        String ref      = "#TKT-" + String.format("%03d", ticket.getId());
        String deadline = ticket.getSlaDeadline().format(FORMAT);

        // Email technicien
        try {
            emailService.sendSlaBreach(
                    tech.getEmail(),
                    tech.getFirstName() + " " + tech.getLastName(),
                    ref, ticket.getTitle(), deadline,
                    false);  // isAdmin = false
            log.info("[SLA-1 EMAIL] Breach envoyé au technicien {}", tech.getEmail());
        } catch (Exception e) {
            log.error("[SLA-1 EMAIL] Échec breach tech {} : {}", tech.getEmail(), e.getMessage());
        }

        // Email à tous les admins avec message d'intervention
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);
        log.info("[SLA-1 EMAIL] Envoi breach admin à {} admin(s)", admins.size());
        admins.forEach(admin -> {
            try {
                emailService.sendSlaBreach(
                        admin.getEmail(),
                        admin.getFirstName() + " " + admin.getLastName(),
                        ref, ticket.getTitle(), deadline,
                        true);  // isAdmin = true → email avec bouton Intervenir
                log.info("[SLA-1 EMAIL] Breach admin envoyé à {}", admin.getEmail());
            } catch (Exception e) {
                log.error("[SLA-1 EMAIL] Échec breach admin {} : {}", admin.getEmail(), e.getMessage());
            }
        });
    }

    /**
     * SLA 2 — Non pris en charge → tous les admins
     */
    private void sendUnassignedEmail(Ticket ticket) {
        String ref       = "#TKT-" + String.format("%03d", ticket.getId());
        String createdAt = ticket.getCreatedAt().format(FORMAT);
        userRepository.findByRole(User.Role.ADMIN).forEach(admin ->
                emailService.sendSlaUnassigned(
                        admin.getEmail(),
                        admin.getFirstName() + " " + admin.getLastName(),
                        ref, ticket.getTitle(), createdAt,
                        ticket.getPriority().getEscaladeMinutes()));
    }

    // ════════════════════════════════════════════════════════════════
    //  UTILITAIRE
    // ════════════════════════════════════════════════════════════════
    private String formatDuree(long minutes) {
        long h = minutes / 60;
        long m = minutes % 60;
        if (h > 0) return h + "h" + (m > 0 ? m + "min" : "");
        return m + " minutes";
    }
}