package com.helpdesk.repository;

import com.helpdesk.entity.Notification;
import com.helpdesk.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserOrderByCreatedAtDesc(User user);

    long countByUserAndLuFalse(User user);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.lu = true WHERE n.user = :user")
    void marquerToutesLues(@Param("user") User user);

    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.ticketId = :ticketId")
    void deleteByTicketId(@Param("ticketId") Long ticketId);
}