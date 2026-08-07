package com.helpdesk.repository;

import com.helpdesk.entity.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketStatusRepository extends JpaRepository<TicketStatus, Long> {

    // Utilisée par TicketStatusService.create() — ligne 17
    boolean existsByName(String name);

    List<TicketStatus> findByActiveTrueOrderByDisplayOrderAsc();

    // Cherche directement le statut fermé sans scanner toute la liste
    Optional<TicketStatus> findFirstByFinalStatusTrueAndActiveTrue();
}