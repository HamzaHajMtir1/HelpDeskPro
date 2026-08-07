package com.helpdesk.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "priorities")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Priority {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    // Niveau de criticité (1 = le plus critique)
    @Column(nullable = false)
    private int level;

    private String color;

    // Délai SLA de résolution (en heures) — ex: 2, 8, 24, 48
    @Column(name = "sla_hours", nullable = false)
    private int slaHours;

    // ✅ NOUVEAU — Délai avant alerte escalade si ticket non pris en charge (en minutes)
    // Critique → 15 min | Haute → 30 min | Moyenne → 120 min | Basse → 240 min
    @Column(name = "escalade_minutes", nullable = false)
    @Builder.Default
    private int escaladeMinutes = 30;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}