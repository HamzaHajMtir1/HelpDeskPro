package com.helpdesk.controller;

import com.helpdesk.dto.AttachmentResponse;
import com.helpdesk.service.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;

    @PostMapping("/{ticketId}/attachments")
    public ResponseEntity<AttachmentResponse> upload(
            @PathVariable Long ticketId,
            @RequestParam("file") MultipartFile file,
            Authentication auth) throws IOException {
        return ResponseEntity.ok(
                attachmentService.upload(ticketId, file, auth.getName()));
    }

    @GetMapping("/{ticketId}/attachments")
    public ResponseEntity<List<AttachmentResponse>> getByTicket(
            @PathVariable Long ticketId) {
        return ResponseEntity.ok(attachmentService.getByTicket(ticketId));
    }

    @GetMapping("/{ticketId}/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> download(
            @PathVariable Long ticketId,
            @PathVariable Long attachmentId) throws IOException {
        return attachmentService.download(attachmentId);
    }
}