package com.helpdesk.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ticket_statuses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private int displayOrder;

    private String color;

    @Column(name = "is_final", nullable = false)
    private boolean finalStatus = false;

    @Column(nullable = false)
    private boolean active = true;

}