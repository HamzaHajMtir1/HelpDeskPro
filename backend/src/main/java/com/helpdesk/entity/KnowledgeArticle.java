package com.helpdesk.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "knowledge_articles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnowledgeArticle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String problem;

    @Column(columnDefinition = "TEXT")
    private String solution;

    private String category;
    private String priority;
    private String tags;

    @Builder.Default
    private int views = 0;

    @Builder.Default
    private int helpful = 0;

    @Builder.Default
    private int notHelpful = 0;

    private Long solutionCommentId;

    // ── PJ épinglées via ticket ───────────────────────────────────
    @ElementCollection
    @CollectionTable(
            name  = "knowledge_solution_attachments",
            joinColumns = @JoinColumn(name = "article_id")
    )
    @Column(name = "attachment_id")
    @Builder.Default
    private List<Long> solutionAttachmentIds = new ArrayList<>();

    // ── PJ uploadées directement sur l'article (sans ticket) ──────
    @ElementCollection
    @CollectionTable(
            name  = "knowledge_article_files",
            joinColumns = @JoinColumn(name = "article_id")
    )
    @Column(name = "file_name")
    @Builder.Default
    private List<String> manualAttachments = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id")
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}