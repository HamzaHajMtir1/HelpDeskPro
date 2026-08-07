package com.helpdesk.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponse {

    private Long id;
    private String title;
    private String description;
    private String type;

    private CategoryInfo category;
    private PriorityInfo priority;
    private StatusInfo   status;

    private UserInfo createdBy;
    private UserInfo assignedTo;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ── SLA ──────────────────────────────────────────────────────
    private LocalDateTime slaDeadline;
    private boolean       slaBreached;
    private String        slaPhase;
    private Integer       slaTotalMinutes;

    // ── Solution épinglée ─────────────────────────────────────────
    private Long        solutionCommentId;

    @Builder.Default
    private List<Long>  solutionAttachmentIds = new ArrayList<>();

    // ─────────────────────────────────────────────────────────────
    @Builder.Default
    private int escaladeCount = 0;
    private Long resolutionMinutes;



    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CategoryInfo {
        private Long   id;
        private String name;
        private String color;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PriorityInfo {
        private Long    id;
        private String  name;
        private String  color;
        private int     slaHours;
        private Integer escaladeMinutes;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class StatusInfo {
        private Long    id;
        private String  name;
        private String  color;
        private boolean finalStatus;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserInfo {
        private Long   id;
        private String firstName;
        private String lastName;
        private String email;
        private String role;
    }
}