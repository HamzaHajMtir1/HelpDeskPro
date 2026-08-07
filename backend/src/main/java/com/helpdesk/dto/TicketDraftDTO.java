package com.helpdesk.dto;

import lombok.Data;

@Data
public class TicketDraftDTO {
    private String title;
    private String description;
    private String category;
    private String priority;
    private String type;
}