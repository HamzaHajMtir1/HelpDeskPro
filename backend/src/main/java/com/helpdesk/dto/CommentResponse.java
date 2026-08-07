package com.helpdesk.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class CommentResponse {

    private Long id;
    private String content;
    private Long ticketId;
    private String authorEmail;
    private String authorName;
    private boolean interne;
    private LocalDateTime createdAt;
}