package com.helpdesk.dto;

import lombok.Data;

@Data
public class ConfirmTicketRequestDTO {
    private TicketDraftDTO draft;
    private String userEmail; // ← String email, pas Long userId
}