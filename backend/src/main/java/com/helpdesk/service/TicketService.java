package com.helpdesk.service;

import com.helpdesk.dto.TicketRequest;
import com.helpdesk.dto.TicketResponse;
import com.helpdesk.entity.*;
import com.helpdesk.entity.TicketHistory.ActionType;
import com.helpdesk.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository        ticketRepository;
    private final UserRepository          userRepository;
    private final CategoryRepository      categoryRepository;
    private final PriorityRepository      priorityRepository;
    private final TicketStatusRepository  ticketStatusRepository;
    private final TicketHistoryRepository ticketHistoryRepository;
    private final TicketHistoryService    ticketHistoryService;
    private final EmailService            emailService;
    private final NotificationService     notificationService;
    private final KnowledgeService        knowledgeService;
    private final NotificationRepository  notificationRepository;

    // ════════════════════════════════════════════════════════════════
    //  CRÉATION
    // ════════════════════════════════════════════════════════════════
    @Transactional
    public TicketResponse create(TicketRequest request, String userEmail) {
        User createdBy = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));
        Priority priority = priorityRepository.findById(request.getPriorityId())
                .orElseThrow(() -> new RuntimeException("Priorité introuvable"));
        TicketStatus defaultStatus = ticketStatusRepository
                .findByActiveTrueOrderByDisplayOrderAsc().stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Aucun statut disponible"));

        LocalDateTime now = LocalDateTime.now();

        Ticket ticket = Ticket.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(category)
                .priority(priority)
                .status(defaultStatus)
                .createdBy(createdBy)
                .assignedTo(null)
                .slaDeadline(now.plusMinutes(priority.getEscaladeMinutes()))
                .slaTotalMinutes(priority.getEscaladeMinutes())
                .slaPhase("PRISE_EN_CHARGE")
                .slaBreached(false)
                .slaWarningEmailSent(false)
                .slaBreachedEmailSent(false)
                .slaUnassignedEmailSent(false)
                .slaEscaladeEffectuee(false)
                .build();
        ticket.setType(Ticket.TicketType.valueOf(request.getType()));

        Ticket saved = ticketRepository.save(ticket);

        ticketHistoryService.record(
                saved, createdBy, ActionType.TICKET_CREATED, null,
                String.format("Priorité: %s | Catégorie: %s | Type: %s",
                        priority.getName(), category.getName(), request.getType())
        );

        try { notificationService.notifierTicketCree(saved); }
        catch (Exception e) { log.warn("Notif création non envoyée : {}", e.getMessage()); }

        return toResponse(saved);
    }

    // ════════════════════════════════════════════════════════════════
    //  MISE À JOUR
    // ════════════════════════════════════════════════════════════════
    @Transactional
    public TicketResponse update(Long id, TicketRequest request) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable"));

        String   oldCatName  = ticket.getCategory().getName();
        String   oldPrioName = ticket.getPriority().getName();
        Category newCategory = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));
        Priority newPriority = priorityRepository.findById(request.getPriorityId())
                .orElseThrow(() -> new RuntimeException("Priorité introuvable"));

        boolean textChanged = !ticket.getTitle().equals(request.getTitle())
                || !ticket.getDescription().equals(request.getDescription());
        boolean catChanged  = !ticket.getCategory().getId().equals(newCategory.getId());
        boolean prioChanged = !ticket.getPriority().getId().equals(newPriority.getId());

        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setCategory(newCategory);
        ticket.setPriority(newPriority);

        if ((catChanged || prioChanged) && ticket.getSlaDeadline() != null) {
            LocalDateTime now = LocalDateTime.now();
            if (ticket.getAssignedTo() != null) {
                ticket.setSlaDeadline(now.plusHours(newPriority.getSlaHours()));
                ticket.setSlaTotalMinutes(newPriority.getSlaHours() * 60);
            } else {
                ticket.setSlaDeadline(now.plusMinutes(newPriority.getEscaladeMinutes()));
                ticket.setSlaTotalMinutes(newPriority.getEscaladeMinutes());
            }
            ticket.setSlaWarningEmailSent(false);
            ticket.setSlaBreachedEmailSent(false);
            ticket.setSlaBreached(false);
        }

        Ticket saved = ticketRepository.save(ticket);
        User actor   = saved.getAssignedTo() != null ? saved.getAssignedTo() : saved.getCreatedBy();

        if (textChanged)  ticketHistoryService.record(saved, actor, ActionType.TICKET_UPDATED);
        if (catChanged)   ticketHistoryService.record(saved, actor, ActionType.CATEGORY_CHANGED, oldCatName, newCategory.getName());
        if (prioChanged)  ticketHistoryService.record(saved, actor, ActionType.PRIORITY_CHANGED, oldPrioName, newPriority.getName());

        return toResponse(saved);
    }

    // ════════════════════════════════════════════════════════════════
    //  LECTURES
    // ════════════════════════════════════════════════════════════════
    public List<TicketResponse> getAll() {
        return ticketRepository.findAll().stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    public TicketResponse getById(Long id) {
        return toResponse(ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable")));
    }

    public List<TicketResponse> getMyTickets(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        return ticketRepository.findByCreatedBy(user).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    // ════════════════════════════════════════════════════════════════
    //  ASSIGNATION ADMIN
    //  ✅ escaladeCount incrémenté si c'est une RÉASSIGNATION
    //     (tech déjà assigné → nouveau tech)
    // ════════════════════════════════════════════════════════════════
    @Transactional
    public TicketResponse assignTicket(Long ticketId, Long technicienId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable"));
        User technicien = userRepository.findById(technicienId)
                .orElseThrow(() -> new RuntimeException("Technicien introuvable"));

        // ── Mémoriser le tech précédent avant modification ────────────
        String oldTechName = ticket.getAssignedTo() != null
                ? ticket.getAssignedTo().getFirstName() + " " + ticket.getAssignedTo().getLastName()
                : null;

        // ── C'est une réassignation si un tech était déjà assigné ─────
        boolean isReassignation = ticket.getAssignedTo() != null;

        TicketStatus enCours = ticketStatusRepository
                .findByActiveTrueOrderByDisplayOrderAsc().stream()
                .filter(s -> s.getName().toLowerCase().contains("cours"))
                .findFirst().orElse(ticket.getStatus());

        LocalDateTime now = LocalDateTime.now();

        ticket.setAssignedTo(technicien);
        ticket.setStatus(enCours);
        ticket.setSlaDeadline(now.plusHours(ticket.getPriority().getSlaHours()));
        ticket.setSlaTotalMinutes(ticket.getPriority().getSlaHours() * 60);
        ticket.setSlaPhase("TRAITEMENT");
        ticket.setSlaBreached(false);
        ticket.setSlaWarningEmailSent(false);
        ticket.setSlaBreachedEmailSent(false);
        ticket.setSlaEscaladeEffectuee(true);

        // ✅ Incrémenter escaladeCount si c'est une réassignation manuelle admin
        if (isReassignation) {
            ticket.setEscaladeCount(ticket.getEscaladeCount() + 1);
            log.info("[ASSIGN] Réassignation admin — ticket #{} → {} | escaladeCount={}",
                    ticketId,
                    technicien.getFirstName() + " " + technicien.getLastName(),
                    ticket.getEscaladeCount());
        }

        Ticket saved = ticketRepository.save(ticket);

        String newTechName = technicien.getFirstName() + " " + technicien.getLastName();
        ActionType action  = isReassignation ? ActionType.REASSIGNED : ActionType.ASSIGNED;
        ticketHistoryService.record(saved, technicien, action, oldTechName, newTechName);

        try { notificationService.notifierTicketAssigne(saved); }
        catch (Exception e) { log.warn("Notif assignation non envoyée : {}", e.getMessage()); }

        return toResponse(saved);
    }

    // ════════════════════════════════════════════════════════════════
    //  CHANGEMENT DE STATUT
    // ════════════════════════════════════════════════════════════════
    @Transactional
    public TicketResponse changeStatus(Long ticketId, Long statusId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable"));
        TicketStatus newStatus = ticketStatusRepository.findById(statusId)
                .orElseThrow(() -> new RuntimeException("Statut introuvable"));

        String oldStatusName = ticket.getStatus().getName();
        ticket.setStatus(newStatus);

        boolean isInfoRequise = newStatus.getName().toLowerCase().contains("information")
                || newStatus.getName().toLowerCase().contains("requise");

        if (isInfoRequise && ticket.getSlaDeadline() != null && ticket.getAssignedTo() != null) {
            LocalDateTime now = LocalDateTime.now();
            ticket.setSlaDeadline(now.plusHours(ticket.getPriority().getSlaHours()));
            ticket.setSlaTotalMinutes(ticket.getPriority().getSlaHours() * 60);
            ticket.setSlaWarningEmailSent(false);
            ticket.setSlaBreachedEmailSent(false);
            ticket.setSlaBreached(false);
        }

        if (newStatus.isFinalStatus() && ticket.getResolutionMinutes() == null
                && ticket.getCreatedAt() != null) {
            ticket.setResolutionMinutes(
                    ChronoUnit.MINUTES.between(ticket.getCreatedAt(), LocalDateTime.now())
            );
        }

        Ticket saved = ticketRepository.save(ticket);
        User actor   = saved.getAssignedTo() != null ? saved.getAssignedTo() : saved.getCreatedBy();

        if (newStatus.isFinalStatus()) {
            ticketHistoryService.record(saved, actor, ActionType.TICKET_CLOSED, oldStatusName, newStatus.getName());
            try { knowledgeService.saveFromTicket(saved.getId()); }
            catch (Exception e) { log.warn("Knowledge save échoué : {}", e.getMessage()); }
            try { notificationService.notifierTicketCloture(saved); }
            catch (Exception e) { log.warn("Notif clôture non envoyée : {}", e.getMessage()); }
        } else if (newStatus.getName().toLowerCase().contains("résolu")
                || newStatus.getName().toLowerCase().contains("resolu")) {
            ticketHistoryService.record(saved, actor, ActionType.TICKET_RESOLVED, oldStatusName, newStatus.getName());
            try { notificationService.notifierTicketResolu(saved); }
            catch (Exception e) { log.warn("Notif résolu non envoyée : {}", e.getMessage()); }
        } else {
            ticketHistoryService.record(saved, actor, ActionType.STATUS_CHANGED, oldStatusName, newStatus.getName());
        }

        if (isInfoRequise) {
            try { notificationService.notifierInfoRequise(saved); }
            catch (Exception e) { log.warn("Notif info requise non envoyée : {}", e.getMessage()); }
        }

        return toResponse(saved);
    }

    // ════════════════════════════════════════════════════════════════
    //  SUPPRESSION
    // ════════════════════════════════════════════════════════════════
    @Transactional
    public String delete(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable"));
        notificationRepository.deleteByTicketId(id);
        ticketRepository.delete(ticket);
        return "Ticket supprimé";
    }

    // ════════════════════════════════════════════════════════════════
    //  TICKETS VISIBLES PAR UN TECHNICIEN
    // ════════════════════════════════════════════════════════════════
    public List<TicketResponse> getAssignedTickets(String userEmail) {
        User technicien = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (technicien.getSpecialtyCategory() == null) return List.of();

        Long categoryId = technicien.getSpecialtyCategory().getId();
        List<Ticket> nonAssigned   = ticketRepository.findByCategory_IdAndAssignedToIsNull(categoryId);
        List<Ticket> myTickets     = ticketRepository.findByCategory_IdAndAssignedTo(categoryId, technicien);
        List<Ticket> othersTickets = ticketRepository.findByCategory_IdAndAssignedToIsNotNull(categoryId);

        List<Ticket> result = new ArrayList<>(nonAssigned);
        Stream.concat(myTickets.stream(), othersTickets.stream())
                .forEach(t -> {
                    if (result.stream().noneMatch(r -> r.getId().equals(t.getId()))) result.add(t);
                });
        return result.stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ════════════════════════════════════════════════════════════════
    //  PRISE EN CHARGE
    // ════════════════════════════════════════════════════════════════
    @Transactional
    public TicketResponse prendreEnCharge(Long ticketId, String userEmail) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable"));
        User technicien = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (ticket.getAssignedTo() != null
                && !ticket.getAssignedTo().getId().equals(technicien.getId())) {
            throw new RuntimeException("Ce ticket est déjà pris en charge par "
                    + ticket.getAssignedTo().getFirstName() + " "
                    + ticket.getAssignedTo().getLastName());
        }

        TicketStatus enCours = ticketStatusRepository
                .findByActiveTrueOrderByDisplayOrderAsc().stream()
                .filter(s -> s.getName().toLowerCase().contains("cours"))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Statut 'En cours' introuvable"));

        boolean alreadyMine    = ticket.getAssignedTo() != null
                && ticket.getAssignedTo().getId().equals(technicien.getId());
        boolean alreadyEnCours = ticket.getStatus().getId().equals(enCours.getId());

        if (alreadyMine && alreadyEnCours) return toResponse(ticket);

        boolean wasUnassigned = ticket.getAssignedTo() == null;
        LocalDateTime now     = LocalDateTime.now();

        ticket.setAssignedTo(technicien);
        ticket.setStatus(enCours);
        ticket.setSlaDeadline(now.plusHours(ticket.getPriority().getSlaHours()));
        ticket.setSlaTotalMinutes(ticket.getPriority().getSlaHours() * 60);
        ticket.setSlaPhase("TRAITEMENT");
        ticket.setSlaBreached(false);
        ticket.setSlaWarningEmailSent(false);
        ticket.setSlaBreachedEmailSent(false);
        ticket.setSlaEscaladeEffectuee(true);

        Ticket saved = ticketRepository.save(ticket);

        if (wasUnassigned) {
            ticketHistoryService.record(saved, technicien, ActionType.ASSIGNED,
                    null, technicien.getFirstName() + " " + technicien.getLastName());
        }
        if (!alreadyEnCours) {
            ticketHistoryService.record(saved, technicien, ActionType.STATUS_CHANGED,
                    ticket.getStatus().getName(), enCours.getName());
        }

        try { notificationService.notifierTicketAssigne(saved); }
        catch (Exception e) { log.warn("Notif prise en charge non envoyée : {}", e.getMessage()); }

        return toResponse(saved);
    }

    // ════════════════════════════════════════════════════════════════
    //  ESCALADE MANUELLE
    // ════════════════════════════════════════════════════════════════
    @Transactional
    public TicketResponse escaladerTicket(Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable"));

        List<User> candidats = userRepository
                .findByRoleAndSpecialtyCategory_Id(User.Role.TECHNICIEN, ticket.getCategory().getId())
                .stream().filter(User::isEnabled).collect(Collectors.toList());

        if (candidats.isEmpty()) {
            candidats = userRepository.findByRole(User.Role.TECHNICIEN)
                    .stream().filter(User::isEnabled).collect(Collectors.toList());
        }
        if (candidats.isEmpty())
            throw new RuntimeException("Aucun technicien disponible pour l'escalade");

        User technicien = candidats.stream()
                .min(Comparator.comparingLong(t ->
                        ticketRepository.countByAssignedToAndStatus_FinalStatusFalse(t)))
                .orElseThrow(() -> new RuntimeException("Impossible de sélectionner un technicien"));

        String oldTechName = ticket.getAssignedTo() != null
                ? ticket.getAssignedTo().getFirstName() + " " + ticket.getAssignedTo().getLastName()
                : "Non assigné";

        LocalDateTime now = LocalDateTime.now();

        ticket.setAssignedTo(technicien);
        ticket.setSlaDeadline(now.plusHours(ticket.getPriority().getSlaHours()));
        ticket.setSlaTotalMinutes(ticket.getPriority().getSlaHours() * 60);
        ticket.setSlaPhase("TRAITEMENT");
        ticket.setSlaBreached(false);
        ticket.setSlaWarningEmailSent(false);
        ticket.setSlaBreachedEmailSent(false);
        ticket.setSlaEscaladeEffectuee(true);
        ticket.setEscaladeCount(ticket.getEscaladeCount() + 1);

        Ticket saved = ticketRepository.save(ticket);

        ticketHistoryService.record(saved, technicien, ActionType.SLA_ESCALATED,
                oldTechName, technicien.getFirstName() + " " + technicien.getLastName());

        try { notificationService.notifierEscalade(saved); }
        catch (Exception e) { log.warn("Notif escalade non envoyée : {}", e.getMessage()); }

        return toResponse(saved);
    }

    // ════════════════════════════════════════════════════════════════
    //  CLÔTURE
    // ════════════════════════════════════════════════════════════════
    @Transactional
    public TicketResponse closeTicket(Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable"));

        TicketStatus closedStatus = ticketStatusRepository
                .findFirstByFinalStatusTrueAndActiveTrue()
                .orElseThrow(() -> new RuntimeException(
                        "Aucun statut final configuré (is_final = true)."));

        String oldStatus = ticket.getStatus().getName();
        ticket.setStatus(closedStatus);

        if (ticket.getResolutionMinutes() == null && ticket.getCreatedAt() != null) {
            ticket.setResolutionMinutes(
                    ChronoUnit.MINUTES.between(ticket.getCreatedAt(), LocalDateTime.now())
            );
        }

        Ticket saved = ticketRepository.save(ticket);

        User actor = saved.getAssignedTo() != null ? saved.getAssignedTo() : saved.getCreatedBy();
        ticketHistoryService.record(saved, actor, ActionType.TICKET_CLOSED, oldStatus, closedStatus.getName());

        try { knowledgeService.saveFromTicket(ticketId); }
        catch (Exception e) { log.warn("Knowledge save échoué : {}", e.getMessage()); }
        try { notificationService.notifierTicketCloture(saved); }
        catch (Exception e) { log.warn("Notif clôture non envoyée : {}", e.getMessage()); }

        return toResponse(saved);
    }

    // ════════════════════════════════════════════════════════════════
    //  UPDATE CATÉGORIE + RÉASSIGNATION
    // ════════════════════════════════════════════════════════════════
    @Transactional
    public TicketResponse updateCategoryAndReassign(Long ticketId, Long newCategoryId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable"));

        String oldCatName  = ticket.getCategory().getName();
        String oldTechName = ticket.getAssignedTo() != null
                ? ticket.getAssignedTo().getFirstName() + " " + ticket.getAssignedTo().getLastName()
                : null;

        Category category = categoryRepository.findById(newCategoryId)
                .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));

        ticket.setCategory(category);

        User newTech = userRepository
                .findByRoleAndSpecialtyCategory_Id(User.Role.TECHNICIEN, newCategoryId)
                .stream().findFirst().orElse(null);

        ticket.setAssignedTo(newTech);

        if (newTech != null) {
            LocalDateTime now = LocalDateTime.now();
            ticket.setSlaDeadline(now.plusHours(ticket.getPriority().getSlaHours()));
            ticket.setSlaTotalMinutes(ticket.getPriority().getSlaHours() * 60);
            ticket.setSlaPhase("TRAITEMENT");
            ticket.setSlaBreached(false);
            ticket.setSlaWarningEmailSent(false);
            ticket.setSlaBreachedEmailSent(false);
            ticket.setSlaEscaladeEffectuee(true);
        }

        Ticket saved = ticketRepository.save(ticket);
        User actor   = newTech != null ? newTech : saved.getCreatedBy();

        ticketHistoryService.record(saved, actor, ActionType.CATEGORY_CHANGED, oldCatName, category.getName());

        if (newTech != null) {
            String newTechName = newTech.getFirstName() + " " + newTech.getLastName();
            ActionType action  = oldTechName != null ? ActionType.REASSIGNED : ActionType.ASSIGNED;
            ticketHistoryService.record(saved, actor, action, oldTechName, newTechName);
        }

        return toResponse(saved);
    }

    // ════════════════════════════════════════════════════════════════
    //  UPDATE PRIORITÉ
    // ════════════════════════════════════════════════════════════════
    @Transactional
    public TicketResponse updatePriority(Long ticketId, Long priorityId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable"));

        String   oldPrioName = ticket.getPriority().getName();
        Priority priority    = priorityRepository.findById(priorityId)
                .orElseThrow(() -> new RuntimeException("Priorité introuvable"));

        ticket.setPriority(priority);

        if (ticket.getSlaDeadline() != null) {
            LocalDateTime now = LocalDateTime.now();
            if (ticket.getAssignedTo() != null) {
                ticket.setSlaDeadline(now.plusHours(priority.getSlaHours()));
                ticket.setSlaTotalMinutes(priority.getSlaHours() * 60);
            } else {
                ticket.setSlaDeadline(now.plusMinutes(priority.getEscaladeMinutes()));
                ticket.setSlaTotalMinutes(priority.getEscaladeMinutes());
            }
            ticket.setSlaBreached(false);
            ticket.setSlaWarningEmailSent(false);
            ticket.setSlaBreachedEmailSent(false);
        }

        Ticket saved = ticketRepository.save(ticket);
        User actor   = saved.getAssignedTo() != null ? saved.getAssignedTo() : saved.getCreatedBy();
        ticketHistoryService.record(saved, actor, ActionType.PRIORITY_CHANGED, oldPrioName, priority.getName());

        return toResponse(saved);
    }

    // ════════════════════════════════════════════════════════════════
    //  PIN SOLUTION
    // ════════════════════════════════════════════════════════════════
    public TicketResponse pinSolution(Long ticketId, Long solutionCommentId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable"));
        ticket.setSolutionCommentId(solutionCommentId);
        return toResponse(ticketRepository.save(ticket));
    }

    // ════════════════════════════════════════════════════════════════
    //  TO RESPONSE
    // ════════════════════════════════════════════════════════════════
    private TicketResponse toResponse(Ticket ticket) {
        boolean isFinal     = ticket.getStatus().isFinalStatus();
        boolean slaBreached = !isFinal
                && ticket.getSlaDeadline() != null
                && LocalDateTime.now().isAfter(ticket.getSlaDeadline());

        String  slaPhase        = null;
        Integer slaTotalMinutes = null;

        if (!isFinal && ticket.getSlaDeadline() != null) {
            if (ticket.getAssignedTo() == null) {
                slaPhase        = "PRISE_EN_CHARGE";
                slaTotalMinutes = ticket.getPriority().getEscaladeMinutes();
            } else {
                slaPhase        = "TRAITEMENT";
                slaTotalMinutes = ticket.getPriority().getSlaHours() * 60;
            }
        }

        return TicketResponse.builder()
                .id(ticket.getId())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .type(ticket.getType() != null ? ticket.getType().name() : null)
                .category(TicketResponse.CategoryInfo.builder()
                        .id(ticket.getCategory().getId())
                        .name(ticket.getCategory().getName())
                        .color(ticket.getCategory().getColor())
                        .build())
                .priority(TicketResponse.PriorityInfo.builder()
                        .id(ticket.getPriority().getId())
                        .name(ticket.getPriority().getName())
                        .color(ticket.getPriority().getColor())
                        .slaHours(ticket.getPriority().getSlaHours())
                        .escaladeMinutes(ticket.getPriority().getEscaladeMinutes())
                        .build())
                .status(TicketResponse.StatusInfo.builder()
                        .id(ticket.getStatus().getId())
                        .name(ticket.getStatus().getName())
                        .color(ticket.getStatus().getColor())
                        .finalStatus(isFinal)
                        .build())
                .createdBy(toUserInfo(ticket.getCreatedBy()))
                .assignedTo(ticket.getAssignedTo() != null ? toUserInfo(ticket.getAssignedTo()) : null)
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .slaDeadline(ticket.getSlaDeadline())
                .slaBreached(slaBreached)
                .slaPhase(slaPhase)
                .slaTotalMinutes(slaTotalMinutes)
                .solutionCommentId(ticket.getSolutionCommentId())
                .solutionAttachmentIds(
                        ticket.getSolutionAttachmentIds() != null
                                ? ticket.getSolutionAttachmentIds()
                                : new ArrayList<>())
                .escaladeCount(ticket.getEscaladeCount())
                .resolutionMinutes(ticket.getResolutionMinutes())
                .build();
    }

    private TicketResponse.UserInfo toUserInfo(User user) {
        return TicketResponse.UserInfo.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    private static final org.slf4j.Logger log =
            org.slf4j.LoggerFactory.getLogger(TicketService.class);
}