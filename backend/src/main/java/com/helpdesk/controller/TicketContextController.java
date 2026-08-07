package com.helpdesk.controller;

import com.helpdesk.dto.AttachmentResponse;
import com.helpdesk.dto.CommentResponse;
import com.helpdesk.dto.TicketHistoryResponse;
import com.helpdesk.dto.TicketResponse;
import com.helpdesk.service.AttachmentService;
import com.helpdesk.service.CommentService;
import com.helpdesk.service.TicketHistoryService;
import com.helpdesk.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class TicketContextController {

    // ✅ Les 4 vrais services de ton projet — méthodes vérifiées
    private final TicketService        ticketService;
    private final CommentService       commentService;
    private final TicketHistoryService ticketHistoryService;
    private final AttachmentService    attachmentService;

    /**
     * Retourne le contexte complet d'un ticket pour l'agent IA Python.
     *
     * Appelé par Python  →  agent2_api.py  →  get_full_context_from_spring()
     * URL : GET /api/tickets/{ticketId}/full-context
     *
     * Réponse JSON :
     * {
     *   "ticket":      { ...TicketResponse... },
     *   "comments":    [ { author, email, message, date, interne } ... ],
     *   "history":     [ { action, actionCode, oldValue, newValue, date, performedBy } ... ],
     *   "attachments": [ { id, name, fileType, filePath, uploadedBy, uploadedAt } ... ]
     * }
     */
    @GetMapping("/{ticketId}/full-context")
    public ResponseEntity<Map<String, Object>> getFullContext(
            @PathVariable Long ticketId) {

        Map<String, Object> result = new LinkedHashMap<>();

        // ── 1. Ticket de base ────────────────────────────────────────────────
        // ticketService.getById() → TicketResponse
        try {
            TicketResponse ticket = ticketService.getById(ticketId);
            result.put("ticket", ticket);
        } catch (Exception e) {
            result.put("ticket", null);
            System.err.println("[FullContext] ticket #" + ticketId + " introuvable : " + e.getMessage());
        }

        // ── 2. Commentaires ──────────────────────────────────────────────────
        // commentService.getByTicket() → List<CommentResponse>
        // CommentResponse fields : content, authorName, authorEmail, createdAt, interne
        try {
            List<CommentResponse> rawComments = commentService.getByTicket(ticketId);

            List<Map<String, Object>> comments = new ArrayList<>();
            for (CommentResponse c : rawComments) {
                Map<String, Object> cm = new LinkedHashMap<>();
                cm.put("author",  c.getAuthorName());    // "Prénom Nom"
                cm.put("email",   c.getAuthorEmail());
                cm.put("message", c.getContent());
                cm.put("date",    c.getCreatedAt() != null ? c.getCreatedAt().toString() : "");
                cm.put("interne", c.isInterne());         // note interne ou commentaire public
                comments.add(cm);
            }
            result.put("comments", comments);
        } catch (Exception e) {
            result.put("comments", Collections.emptyList());
            System.err.println("[FullContext] comments error : " + e.getMessage());
        }

        // ── 3. Historique des actions ────────────────────────────────────────
        // ticketHistoryService.getHistory(id, role) → List<TicketHistoryResponse>
        // On passe "TECHNICIEN" → accès complet (inclut notes internes, SLA, etc.)
        // TicketHistoryResponse fields : action, actionLabel, oldValue, newValue, createdAt, performedBy
        try {
            List<TicketHistoryResponse> rawHistory =
                    ticketHistoryService.getHistory(ticketId, "TECHNICIEN");

            List<Map<String, Object>> history = new ArrayList<>();
            for (TicketHistoryResponse h : rawHistory) {
                Map<String, Object> hm = new LinkedHashMap<>();
                hm.put("action",      h.getActionLabel());  // libellé lisible en français
                hm.put("actionCode",  h.getAction());        // ex: "STATUS_CHANGED"
                hm.put("oldValue",    h.getOldValue() != null ? h.getOldValue() : "");
                hm.put("newValue",    h.getNewValue() != null ? h.getNewValue() : "");
                hm.put("date",        h.getCreatedAt() != null ? h.getCreatedAt().toString() : "");
                if (h.getPerformedBy() != null) {
                    hm.put("performedBy",
                            h.getPerformedBy().getFirstName()
                                    + " " + h.getPerformedBy().getLastName()
                                    + " (" + h.getPerformedBy().getRole() + ")");
                } else {
                    hm.put("performedBy", "Système");
                }
                history.add(hm);
            }
            result.put("history", history);
        } catch (Exception e) {
            result.put("history", Collections.emptyList());
            System.err.println("[FullContext] history error : " + e.getMessage());
        }

        // ── 4. Pièces jointes ────────────────────────────────────────────────
        // attachmentService.getByTicket() → List<AttachmentResponse>
        // AttachmentResponse fields : id, fileName, fileType, filePath, ticketId, uploadedBy, uploadedAt
        try {
            List<AttachmentResponse> rawAttachments = attachmentService.getByTicket(ticketId);

            List<Map<String, Object>> attachments = new ArrayList<>();
            for (AttachmentResponse a : rawAttachments) {
                Map<String, Object> am = new LinkedHashMap<>();
                am.put("id",         a.getId());
                am.put("name",       a.getFileName());
                am.put("fileType",   a.getFileType());
                am.put("filePath",   a.getFilePath());
                am.put("uploadedBy", a.getUploadedBy());     // email de l'uploader
                am.put("uploadedAt", a.getUploadedAt() != null ? a.getUploadedAt().toString() : "");
                attachments.add(am);
            }
            result.put("attachments", attachments);
        } catch (Exception e) {
            result.put("attachments", Collections.emptyList());
            System.err.println("[FullContext] attachments error : " + e.getMessage());
        }

        return ResponseEntity.ok(result);
    }
}