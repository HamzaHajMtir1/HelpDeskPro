package com.helpdesk.repository;

import com.helpdesk.entity.Ticket;
import com.helpdesk.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByCreatedBy(User user);

    List<Ticket> findByCategory_IdAndAssignedToIsNull(Long categoryId);

    List<Ticket> findByCategory_IdAndAssignedTo(Long categoryId, User assignedTo);

    List<Ticket> findByCategory_IdAndAssignedToIsNotNull(Long categoryId);

    long countByAssignedToAndStatus_FinalStatusFalse(User assignedTo);

    // Tickets avec SLA actif (assignés, non finaux, deadline dans les 24h)
    @Query("""
        SELECT t FROM Ticket t
        WHERE t.assignedTo IS NOT NULL
          AND t.slaDeadline IS NOT NULL
          AND t.status.finalStatus = false
          AND t.slaDeadline <= :deadline
        """)
    List<Ticket> findTicketsAtRiskBefore(@Param("deadline") LocalDateTime deadline);

    // ✅ NOUVEAU — remplace findUnassignedTicketsOlderThan(LocalDateTime)
    // Retourne TOUS les tickets non assignés et non finaux.
    // Le filtrage par escaladeMinutes se fait en Java dans SlaScheduler,
    // car chaque priorité a son propre délai.
    @Query("""
        SELECT t FROM Ticket t
        WHERE t.assignedTo IS NULL
          AND t.status.finalStatus = false
        """)
    List<Ticket> findUnassignedAndNotFinal();

    // Ancienne méthode conservée pour compatibilité (peut être supprimée)
    @Query("""
        SELECT t FROM Ticket t
        WHERE t.assignedTo IS NULL
          AND t.status.finalStatus = false
          AND t.createdAt <= :threshold
        """)
    List<Ticket> findUnassignedTicketsOlderThan(@Param("threshold") LocalDateTime threshold);
    // TicketRepository.java — ajouter cette méthode
    @Query(value = """
    SELECT DISTINCT t.* FROM tickets t
    JOIN ticket_statuses ts ON t.status_id = ts.id
    WHERE ts.nom = :statusNom
    AND (
        LOWER(t.titre) LIKE CONCAT('%', :#{#keywords[0]}, '%')
        OR LOWER(t.description) LIKE CONCAT('%', :#{#keywords[0]}, '%')
        OR (:#{#keywords.length} > 1 AND (
            LOWER(t.titre) LIKE CONCAT('%', :#{#keywords[1]}, '%')
            OR LOWER(t.description) LIKE CONCAT('%', :#{#keywords[1]}, '%')
        ))
        OR (:#{#keywords.length} > 2 AND (
            LOWER(t.titre) LIKE CONCAT('%', :#{#keywords[2]}, '%')
            OR LOWER(t.description) LIKE CONCAT('%', :#{#keywords[2]}, '%')
        ))
    )
    ORDER BY t.created_at DESC
    LIMIT 10
    """, nativeQuery = true)
    List<Ticket> findByStatusNomAndKeywords(
            @Param("statusNom") String statusNom,
            @Param("keywords") String[] keywords
    );
}