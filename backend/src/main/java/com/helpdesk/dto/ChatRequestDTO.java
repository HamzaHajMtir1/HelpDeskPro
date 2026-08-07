package com.helpdesk.dto;
import com.helpdesk.dto.ChatMessageDTO;

import lombok.Data;

import java.util.List;

// dto/ChatRequestDTO.java
@Data
public class ChatRequestDTO {
    private List<ChatMessageDTO> messages;
    private String userId;
    private String userEmail;   // ← AJOUTER CE CHAMP
    private String phase;
}
