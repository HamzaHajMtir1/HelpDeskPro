package com.helpdesk.dto;

import lombok.Data;

// ChatMessageDTO.java
@Data
public class ChatMessageDTO {
    private String role;    // "user", "assistant", "system"
    private String content;
}