package com.helpdesk.dto;

import com.helpdesk.entity.Notification;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {

    private Long id;
    private String titre;
    private String message;
    private String type;
    private Long ticketId;
    private boolean lu;
    private LocalDateTime createdAt;

    public static NotificationResponse fromEntity(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .titre(n.getTitre())
                .message(n.getMessage())
                .type(n.getType())
                .ticketId(n.getTicketId())
                .lu(n.isLu())
                .createdAt(n.getCreatedAt())
                .build();
    }
}