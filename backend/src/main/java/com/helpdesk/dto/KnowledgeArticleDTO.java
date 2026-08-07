package com.helpdesk.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnowledgeArticleDTO {
    private Long   id;
    private String title;
    private String problem;
    private String solution;
    private String category;
    private String priority;
    private int    views;
    private int    helpful;
    private int    notHelpful;
    private Long   ticketId;

    // ── Solution commentaire épinglé (un seul) ──
    private Long               solutionCommentId;
    private SolutionCommentDTO solutionComment;

    // ── Pièces jointes épinglées comme solution (plusieurs) ──
    @Builder.Default
    private List<Long>                  solutionAttachmentIds = new ArrayList<>();
    @Builder.Default
    private List<SolutionAttachmentDTO> solutionAttachments   = new ArrayList<>();

    private String        tags;
    private String        createdByName;
    private LocalDateTime createdAt;

    // ─────────────────────────────────────────────────────────────
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SolutionCommentDTO {
        private Long          id;
        private String        content;
        private String        authorName;
        private LocalDateTime createdAt;
    }

    // ─────────────────────────────────────────────────────────────
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SolutionAttachmentDTO {
        private Long          id;
        private String        fileName;        // nom affiché (sans préfixe timestamp)
        private String        storedFileName;  // ← nom physique sur disque
        private String        fileType;
        private String        uploadedBy;
        private LocalDateTime uploadedAt;
    }
}