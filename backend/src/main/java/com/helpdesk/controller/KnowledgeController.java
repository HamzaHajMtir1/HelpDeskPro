package com.helpdesk.controller;

import com.helpdesk.dto.KnowledgeArticleDTO;
import com.helpdesk.entity.KnowledgeArticle;
import com.helpdesk.repository.KnowledgeArticleRepository;
import com.helpdesk.service.KnowledgeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/knowledge")
@RequiredArgsConstructor
public class KnowledgeController {

    private final KnowledgeService           service;
    private final KnowledgeArticleRepository knowledgeRepository;

    // URL Flask Agent 2 — rebuild index automatique après chaque modif KB
    private static final String FLASK_REBUILD_URL = "http://localhost:5002/agent2/rebuild-index";

    // ─────────────────────────────────────────────────────────────────────────
    // HELPER — Appel Flask pour rebuild FAISS index en arrière-plan
    // Appelé après tout ajout, modification ou suppression d'article KB
    // ─────────────────────────────────────────────────────────────────────────
    private void triggerFaissRebuild() {
        // Thread daemon classique — compatible Java 17+
        Thread thread = new Thread(() -> {
            try {
                HttpClient client = HttpClient.newBuilder()
                        .connectTimeout(Duration.ofSeconds(5))
                        .build();
                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create(FLASK_REBUILD_URL))
                        .POST(HttpRequest.BodyPublishers.noBody())
                        .header("Content-Type", "application/json")
                        .timeout(Duration.ofSeconds(10))
                        .build();
                HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
                log.info("[KB] Rebuild FAISS déclenché → status={}", resp.statusCode());
            } catch (Exception e) {
                log.warn("[KB] Rebuild FAISS non déclenché (Flask injoignable) : {}", e.getMessage());
            }
        });
        thread.setDaemon(true);
        thread.setName("faiss-rebuild");
        thread.start();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LECTURE
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping
    public List<KnowledgeArticleDTO> getAll() {
        return service.getAll().stream()
                .map(service::toDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<KnowledgeArticleDTO> getById(@PathVariable Long id) {
        service.incrementViews(id);
        KnowledgeArticle article = service.findById(id);
        return ResponseEntity.ok(service.toDTO(article));
    }

    @GetMapping("/search")
    public List<KnowledgeArticleDTO> search(@RequestParam String q) {
        return service.search(q).stream()
                .map(service::toDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/category/{category}")
    public List<KnowledgeArticleDTO> getByCategory(@PathVariable String category) {
        return service.getByCategory(category).stream()
                .map(service::toDTO)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CRÉATION — Admin uniquement + rebuild auto
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<KnowledgeArticleDTO> create(@RequestBody KnowledgeArticleDTO dto) {
        KnowledgeArticle created = service.createManually(dto);
        // ✅ Rebuild FAISS automatiquement après création
        triggerFaissRebuild();
        return ResponseEntity.ok(service.toDTO(created));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MODIFICATION — Admin + Technicien + rebuild auto
    // ─────────────────────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIEN')")
    public ResponseEntity<KnowledgeArticleDTO> update(
            @PathVariable Long id,
            @RequestBody KnowledgeArticleDTO dto) {
        KnowledgeArticle updated = service.update(id, dto);
        // ✅ Rebuild FAISS automatiquement après modification
        triggerFaissRebuild();
        return ResponseEntity.ok(service.toDTO(updated));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SUPPRESSION — Admin uniquement + rebuild auto
    // ─────────────────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        // ✅ Rebuild FAISS automatiquement après suppression
        triggerFaissRebuild();
        return ResponseEntity.noContent().build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VOTE
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/{id}/vote")
    public ResponseEntity<?> vote(@PathVariable Long id, @RequestParam String type) {
        try {
            KnowledgeArticle article = service.findById(id);
            if ("up".equals(type)) article.setHelpful(article.getHelpful() + 1);
            else                   article.setNotHelpful(article.getNotHelpful() + 1);
            knowledgeRepository.save(article);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPLOAD PIÈCE JOINTE — Admin ET Technicien
    // ✅ Le technicien peut maintenant uploader une PJ sur un article KB
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/{id}/attachments")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIEN')")
    public ResponseEntity<?> uploadAttachment(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        try {
            KnowledgeArticle article = service.findById(id);

            // Dossier de stockage : uploads/knowledge/{articleId}/
            String uploadDir = "uploads/knowledge/" + id + "/";
            File   dir       = new File(uploadDir);
            if (!dir.exists()) dir.mkdirs();

            String originalName = file.getOriginalFilename();
            // Préfixe timestamp pour éviter les conflits de noms
            String fileName = System.currentTimeMillis() + "_" + originalName;
            Path   dest     = Paths.get(uploadDir + fileName);
            Files.write(dest, file.getBytes());

            // Stocker le nom dans manualAttachments
            article.getManualAttachments().add(fileName);
            knowledgeRepository.save(article);

            log.info("[KB] PJ uploadée sur article {} : {}", id, originalName);

            return ResponseEntity.ok(Map.of(
                    "fileName",  fileName,
                    "original",  originalName,
                    "articleId", id
            ));
        } catch (Exception e) {
            log.error("[KB] Erreur upload PJ : {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SUPPRESSION PIÈCE JOINTE — Admin ET Technicien
    // ─────────────────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}/attachments/{fileName}")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIEN')")
    public ResponseEntity<?> deleteAttachment(
            @PathVariable Long id,
            @PathVariable String fileName) {
        try {
            KnowledgeArticle article = service.findById(id);

            // Supprimer du disque
            Path filePath = Paths.get("uploads/knowledge/" + id + "/" + fileName);
            Files.deleteIfExists(filePath);

            // Supprimer de la liste
            article.getManualAttachments().remove(fileName);
            knowledgeRepository.save(article);

            log.info("[KB] PJ supprimée de l'article {} : {}", id, fileName);
            return ResponseEntity.ok(Map.of("deleted", true));
        } catch (Exception e) {
            log.error("[KB] Erreur suppression PJ : {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TÉLÉCHARGEMENT PIÈCE JOINTE — accessible à tous les rôles authentifiés
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/{id}/attachments/{fileName}/download")
    public ResponseEntity<org.springframework.core.io.Resource> downloadAttachment(
            @PathVariable Long id,
            @PathVariable String fileName) {
        try {
            Path filePath = Paths.get("uploads/knowledge/" + id + "/" + fileName);
            org.springframework.core.io.Resource resource =
                    new org.springframework.core.io.UrlResource(filePath.toUri());

            if (!resource.exists())
                return ResponseEntity.notFound().build();

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) contentType = "application/octet-stream";

            // Nom propre pour le téléchargement (sans le préfixe timestamp)
            String displayName = fileName.contains("_")
                    ? fileName.substring(fileName.indexOf('_') + 1)
                    : fileName;

            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"" + displayName + "\"")
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .body(resource);
        } catch (Exception e) {
            log.error("[KB] Erreur téléchargement PJ : {}", e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }
}