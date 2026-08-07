package com.helpdesk.repository;

import com.helpdesk.entity.Ticket;
import com.helpdesk.entity.TicketHistory;
import com.helpdesk.entity.TicketHistory.ActionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TicketHistoryRepository extends JpaRepository<TicketHistory, Long> {

    List<TicketHistory> findByTicketOrderByCreatedAtAsc(Ticket ticket);

    @Query("""
        SELECT h FROM TicketHistory h
        WHERE h.ticket.id = :ticketId
        ORDER BY h.createdAt ASC
    """)
    List<TicketHistory> findByTicketIdOrderByCreatedAtAsc(@Param("ticketId") Long ticketId);

    @Query("""
        SELECT h FROM TicketHistory h
        WHERE h.ticket.id = :ticketId
          AND h.action NOT IN :excluded
        ORDER BY h.createdAt ASC
    """)
    List<TicketHistory> findByTicketIdExcludingActions(
            @Param("ticketId") Long ticketId,
            @Param("excluded") List<ActionType> excluded
    );

    // ── FIX suppression ticket ────────────────────────────────────────
    @Modifying
    @Query("DELETE FROM TicketHistory h WHERE h.ticket.id = :ticketId")
    void deleteByTicketId(@Param("ticketId") Long ticketId);
}