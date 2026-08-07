package com.helpdesk.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TicketStatusRequest {

    @NotBlank
    private String name;

    @NotNull
    private int displayOrder;

    private String color;

    private boolean finalStatus; //  renommé de isFinal → finalStatus
}