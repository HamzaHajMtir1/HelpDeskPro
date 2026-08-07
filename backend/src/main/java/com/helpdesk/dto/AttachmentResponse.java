package com.helpdesk.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class AttachmentResponse {

    private Long id;
    private String fileName;
    private String fileType;
    private String filePath;
    private Long ticketId;
    private String uploadedBy;
    private LocalDateTime uploadedAt;
}