package com.helpdesk.service;

import com.helpdesk.dto.PriorityRequest;
import com.helpdesk.entity.Priority;
import com.helpdesk.repository.PriorityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PriorityService {

    private final PriorityRepository priorityRepository;

    public Priority create(PriorityRequest request) {
        if (priorityRepository.existsByName(request.getName()))
            throw new RuntimeException("Priorité déjà existante : " + request.getName());

        Priority priority = Priority.builder()
                .name(request.getName())
                .level(request.getLevel())
                .color(request.getColor())
                .slaHours(request.getSlaHours())
                .escaladeMinutes(request.getEscaladeMinutes()) // ✅
                .active(true)
                .build();

        return priorityRepository.save(priority);
    }

    public List<Priority> getAll() {
        return priorityRepository.findAll();
    }

    public List<Priority> getActive() {
        return priorityRepository.findByActiveTrueOrderByLevelAsc();
    }

    public Priority update(Long id, PriorityRequest request) {
        Priority priority = priorityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Priorité introuvable"));

        priority.setName(request.getName());
        priority.setLevel(request.getLevel());
        priority.setColor(request.getColor());
        priority.setSlaHours(request.getSlaHours());
        priority.setEscaladeMinutes(request.getEscaladeMinutes()); // ✅

        return priorityRepository.save(priority);
    }

    public String toggle(Long id) {
        Priority priority = priorityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Priorité introuvable"));
        priority.setActive(!priority.isActive());
        priorityRepository.save(priority);
        return priority.isActive() ? "Priorité activée" : "Priorité désactivée";
    }

    public String delete(Long id) {
        if (!priorityRepository.existsById(id))
            throw new RuntimeException("Priorité introuvable");
        priorityRepository.deleteById(id);
        return "Priorité supprimée";
    }

    public Priority getById(Long id) {
        return priorityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Priorité introuvable"));
    }
}