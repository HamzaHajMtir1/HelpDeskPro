package com.helpdesk.service;

import com.helpdesk.dto.TicketStatusRequest;
import com.helpdesk.entity.TicketStatus;
import com.helpdesk.repository.TicketStatusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TicketStatusService {

    private final TicketStatusRepository ticketStatusRepository;

    public TicketStatus create(TicketStatusRequest request) {
        if (ticketStatusRepository.existsByName(request.getName()))
            throw new RuntimeException("Statut déjà existant : " + request.getName());
        TicketStatus status = TicketStatus.builder()
                .name(request.getName())
                .displayOrder(request.getDisplayOrder())
                .color(request.getColor())
                .finalStatus(request.isFinalStatus())
                .active(true)
                .build();
        return ticketStatusRepository.save(status);
    }

    public List<TicketStatus> getAll() {
        return ticketStatusRepository.findAll();
    }

    public List<TicketStatus> getActive() {
        return ticketStatusRepository.findByActiveTrueOrderByDisplayOrderAsc();
    }

    public TicketStatus update(Long id, TicketStatusRequest request) {
        TicketStatus status = ticketStatusRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Statut introuvable"));
        status.setName(request.getName());
        status.setDisplayOrder(request.getDisplayOrder());
        status.setColor(request.getColor());
        status.setFinalStatus(request.isFinalStatus());
        return ticketStatusRepository.save(status);
    }

    public String toggle(Long id) {
        TicketStatus status = ticketStatusRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Statut introuvable"));
        status.setActive(!status.isActive());
        ticketStatusRepository.save(status);
        return status.isActive() ? "Statut activé" : "Statut désactivé";
    }

    public String delete(Long id) {
        if (!ticketStatusRepository.existsById(id))
            throw new RuntimeException("Statut introuvable");
        ticketStatusRepository.deleteById(id);
        return "Statut supprimé";
    }public TicketStatus getById(Long id) {
        return ticketStatusRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Statut introuvable"));
    }
}