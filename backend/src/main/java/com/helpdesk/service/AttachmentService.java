package com.helpdesk.service;

import com.helpdesk.dto.AttachmentResponse;
import com.helpdesk.entity.Attachment;
import com.helpdesk.entity.Ticket;
import com.helpdesk.entity.TicketHistory.ActionType;
import com.helpdesk.entity.User;
import com.helpdesk.repository.AttachmentRepository;
import com.helpdesk.repository.TicketRepository;
import com.helpdesk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final TicketRepository     ticketRepository;
    private final UserRepository       userRepository;
    private final TicketHistoryService ticketHistoryService;

    private final String UPLOAD_DIR = "uploads/";

    @Transactional
    public AttachmentResponse upload(Long ticketId, MultipartFile file, String email)
            throws IOException {

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket non trouvé"));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        Attachment attachment = Attachment.builder()
                .fileName(file.getOriginalFilename())
                .fileType(file.getContentType() != null
                        ? file.getContentType()
                        : "application/octet-stream")
                .filePath(filePath.toString())
                .fileSize(file.getSize())
                .ticket(ticket)
                .uploadedBy(user)
                .build();

        Attachment saved = attachmentRepository.save(attachment);

        // ── Historique : encode "ID:fileName" dans newValue ──────────
        // Le TicketHistoryService parsera ce format pour extraire
        // l'attachmentId et l'attachmentName séparément dans le DTO.
        // Format : "<id>:<originalFileName>"
        String newValue = saved.getId() + ":" + file.getOriginalFilename();

        ticketHistoryService.record(ticket, user, ActionType.ATTACHMENT_ADDED,
                null, newValue);

        return toResponse(saved);
    }

    public List<AttachmentResponse> getByTicket(Long ticketId) {
        return attachmentRepository.findByTicketId(ticketId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ResponseEntity<Resource> download(Long attachmentId) throws IOException {

        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Pièce jointe introuvable"));

        Path filePath = Paths.get(attachment.getFilePath());

        if (!Files.exists(filePath)) {
            throw new RuntimeException("Fichier introuvable sur le disque : "
                    + attachment.getFilePath());
        }

        Resource resource;
        try {
            resource = new UrlResource(filePath.toUri());
        } catch (MalformedURLException e) {
            throw new RuntimeException("URL de fichier invalide", e);
        }

        String contentType = attachment.getFileType();
        if (contentType == null || contentType.isBlank()) {
            contentType = Files.probeContentType(filePath);
        }
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + attachment.getFileName() + "\"")
                .body(resource);
    }

    private AttachmentResponse toResponse(Attachment a) {
        return AttachmentResponse.builder()
                .id(a.getId())
                .fileName(a.getFileName())
                .fileType(a.getFileType())
                .filePath(a.getFilePath())
                .ticketId(a.getTicket().getId())
                .uploadedBy(a.getUploadedBy().getEmail())
                .uploadedAt(a.getUploadedAt())
                .build();
    }
}