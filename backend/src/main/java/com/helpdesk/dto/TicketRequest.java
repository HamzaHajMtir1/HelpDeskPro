package com.helpdesk.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TicketRequest {
    @NotBlank
    private String title;
    @NotBlank
    private String description;
    @NotNull
    private Long priorityId;
    @NotNull
    private Long categoryId;
    //@NotBlank
    private String type; // "INCIDENT" ou "DEMANDE"
}