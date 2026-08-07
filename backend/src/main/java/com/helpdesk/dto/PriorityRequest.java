package com.helpdesk.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PriorityRequest {

    @NotBlank
    private String name;

    @NotNull
    private int level;

    private String color;

    // Délai SLA résolution en heures
    @Min(value = 1, message = "Le SLA doit être d'au moins 1 heure")
    private int slaHours;

    // ✅ NOUVEAU — Délai avant escalade en minutes (si ticket non pris en charge)
    // Valeur par défaut : 30 min si non fourni
    @Min(value = 1, message = "Le délai d'escalade doit être d'au moins 1 minute")
    private int escaladeMinutes = 30;
}