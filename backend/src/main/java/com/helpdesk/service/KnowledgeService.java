package com.helpdesk.service;

import com.helpdesk.dto.KnowledgeArticleDTO;
import com.helpdesk.dto.KbResultDTO;
import com.helpdesk.entity.Attachment;
import com.helpdesk.entity.KnowledgeArticle;
import com.helpdesk.entity.Ticket;
import com.helpdesk.entity.User;
import com.helpdesk.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class KnowledgeService {

    private final KnowledgeArticleRepository repo;
    private final TicketRepository           ticketRepository;
    private final AttachmentRepository       attachmentRepository;
    private final CategoryRepository         categoryRepository;
    private final PriorityRepository         priorityRepository;

    // URL Flask Agent 2 — rebuild index FAISS automatique
    private static final String FLASK_REBUILD_URL = "http://localhost:5002/agent2/rebuild-index";

    // ═══════════════════════════════════════════════════════════════════════
    // HELPER — Rebuild FAISS en arrière-plan (non bloquant)
    // ═══════════════════════════════════════════════════════════════════════
    void triggerFaissRebuild() {
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
                log.info("[KB] Rebuild FAISS declenche -> status={}", resp.statusCode());
            } catch (Exception e) {
                log.warn("[KB] Rebuild FAISS non declenche (Flask injoignable) : {}", e.getMessage());
            }
        });
        thread.setDaemon(true);
        thread.setName("faiss-rebuild");
        thread.start();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CRÉATION AUTOMATIQUE DEPUIS TICKET (clôture)
    // ═══════════════════════════════════════════════════════════════════════
    @Transactional
    public KnowledgeArticle saveFromTicket(Long ticketId) {
        if (repo.existsByTicketId(ticketId)) return null;

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable"));

        String solution = "Solution appliquée par le technicien.";
        Long   pinnedId = ticket.getSolutionCommentId();

        if (pinnedId != null && ticket.getComments() != null) {
            solution = ticket.getComments().stream()
                    .filter(c -> c.getId().equals(pinnedId))
                    .map(c -> c.getContent())
                    .findFirst()
                    .orElse(solution);
        } else if (ticket.getComments() != null && !ticket.getComments().isEmpty()) {
            solution = ticket.getComments().stream()
                    .filter(c -> c.getAuthor() != null
                            && User.Role.TECHNICIEN.equals(c.getAuthor().getRole())
                            && !c.isInterne())
                    .reduce((first, second) -> second)
                    .map(c -> c.getContent())
                    .orElse(solution);
        }

        List<Long> pinnedAttachmentIds = ticket.getSolutionAttachmentIds() != null
                ? new ArrayList<>(ticket.getSolutionAttachmentIds())
                : new ArrayList<>();

        KnowledgeArticle article = KnowledgeArticle.builder()
                .title(ticket.getTitle())
                .problem(ticket.getDescription())
                .solution(solution)
                .category(ticket.getCategory().getName())
                .priority(ticket.getPriority().getName())
                .solutionCommentId(pinnedId)
                .solutionAttachmentIds(pinnedAttachmentIds)
                .ticket(ticket)
                .createdBy(ticket.getAssignedTo() != null
                        ? ticket.getAssignedTo()
                        : ticket.getCreatedBy())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        KnowledgeArticle saved = repo.save(article);

        triggerFaissRebuild();
        log.info("[KB] Article cree depuis ticket #{} -> rebuild FAISS lance", ticketId);

        return saved;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LECTURES
    // ═══════════════════════════════════════════════════════════════════════

    public List<KnowledgeArticle> getAll() {
        return repo.findAll();
    }

    public KnowledgeArticle findById(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Article introuvable"));
    }

    @Transactional
    public KnowledgeArticle incrementViews(Long id) {
        KnowledgeArticle a = findById(id);
        a.setViews(a.getViews() + 1);
        return repo.save(a);
    }

    public List<KnowledgeArticle> search(String query) {
        return repo.fullSearch(query);
    }

    public List<KnowledgeArticle> getByCategory(String category) {
        return repo.findByCategoryIgnoreCase(category);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CRÉATION MANUELLE (Admin)
    // Le rebuild est déclenché depuis KnowledgeController
    // ═══════════════════════════════════════════════════════════════════════
    @Transactional
    public KnowledgeArticle createManually(KnowledgeArticleDTO dto) {
        KnowledgeArticle article = KnowledgeArticle.builder()
                .title(dto.getTitle())
                .problem(dto.getProblem())
                .solution(dto.getSolution())
                .category(dto.getCategory())
                .tags(dto.getTags())
                .priority(dto.getPriority())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        return repo.save(article);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODIFICATION
    // Le rebuild est déclenché depuis KnowledgeController
    // ═══════════════════════════════════════════════════════════════════════
    @Transactional
    public KnowledgeArticle update(Long id, KnowledgeArticleDTO dto) {
        KnowledgeArticle article = findById(id);
        article.setTitle(dto.getTitle());
        article.setProblem(dto.getProblem());
        article.setSolution(dto.getSolution());
        article.setCategory(dto.getCategory());
        article.setTags(dto.getTags());
        if (dto.getPriority() != null) {
            article.setPriority(dto.getPriority());
        }
        article.setUpdatedAt(LocalDateTime.now());
        return repo.save(article);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SUPPRESSION
    // Le rebuild est déclenché depuis KnowledgeController
    // ═══════════════════════════════════════════════════════════════════════
    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DTO — Conversion Article → DTO
    // ═══════════════════════════════════════════════════════════════════════
    public KnowledgeArticleDTO toDTO(KnowledgeArticle a) {

        // ── Commentaire épinglé ───────────────────────────────────────────────
        KnowledgeArticleDTO.SolutionCommentDTO solutionCommentDTO = null;
        if (a.getSolutionCommentId() != null
                && a.getTicket() != null
                && a.getTicket().getComments() != null) {
            solutionCommentDTO = a.getTicket().getComments().stream()
                    .filter(c -> c.getId().equals(a.getSolutionCommentId()))
                    .findFirst()
                    .map(c -> KnowledgeArticleDTO.SolutionCommentDTO.builder()
                            .id(c.getId())
                            .content(c.getContent())
                            .authorName(c.getAuthor() != null
                                    ? c.getAuthor().getFirstName() + " " + c.getAuthor().getLastName()
                                    : "Technicien")
                            .createdAt(c.getCreatedAt())
                            .build())
                    .orElse(null);
        }

        // ── PJ épinglées via ticket ───────────────────────────────────────────
        List<Long> pinnedIds = new ArrayList<>();

        if (a.getSolutionAttachmentIds() != null && !a.getSolutionAttachmentIds().isEmpty()) {
            pinnedIds = a.getSolutionAttachmentIds();
        } else if (a.getTicket() != null
                && a.getTicket().getSolutionAttachmentIds() != null
                && !a.getTicket().getSolutionAttachmentIds().isEmpty()) {
            pinnedIds = a.getTicket().getSolutionAttachmentIds();
            a.setSolutionAttachmentIds(pinnedIds);
            repo.save(a);
        }

        List<KnowledgeArticleDTO.SolutionAttachmentDTO> attachmentDTOs = new ArrayList<>();
        if (!pinnedIds.isEmpty()) {
            List<Attachment> attachments = attachmentRepository.findAllById(pinnedIds);
            attachmentDTOs = attachments.stream()
                    .map(att -> KnowledgeArticleDTO.SolutionAttachmentDTO.builder()
                            .id(att.getId())
                            .fileName(att.getFileName())
                            .storedFileName(null) // PJ ticket : pas de storedFileName
                            .fileType(att.getFileType())
                            .uploadedBy(att.getUploadedBy() != null
                                    ? att.getUploadedBy().getFirstName() + " " + att.getUploadedBy().getLastName()
                                    : "Technicien")
                            .uploadedAt(att.getUploadedAt())
                            .build())
                    .collect(Collectors.toList());
        }

        // ── PJ manuelles (articles sans ticket, ajoutés par admin/tech) ───────
        if (a.getManualAttachments() != null && !a.getManualAttachments().isEmpty()) {
            long fakeId = -1L;
            for (String storedName : a.getManualAttachments()) {
                // Le nom stocké est de la forme "timestamp_nomOriginal"
                String originalName = storedName.contains("_")
                        ? storedName.substring(storedName.indexOf('_') + 1)
                        : storedName;
                attachmentDTOs.add(
                        KnowledgeArticleDTO.SolutionAttachmentDTO.builder()
                                .id(fakeId--)
                                .fileName(originalName)
                                .storedFileName(storedName)  // ← nom physique pour le téléchargement
                                .fileType(null)
                                .uploadedBy("Admin")
                                .uploadedAt(a.getUpdatedAt())
                                .build()
                );
            }
        }

        return KnowledgeArticleDTO.builder()
                .id(a.getId())
                .title(a.getTitle())
                .problem(a.getProblem())
                .solution(a.getSolution())
                .category(a.getCategory())
                .priority(a.getPriority())
                .tags(a.getTags())
                .views(a.getViews())
                .helpful(a.getHelpful())
                .notHelpful(a.getNotHelpful())
                .solutionCommentId(a.getSolutionCommentId())
                .solutionComment(solutionCommentDTO)
                .solutionAttachmentIds(pinnedIds)
                .solutionAttachments(attachmentDTOs)
                .ticketId(a.getTicket() != null ? a.getTicket().getId() : null)
                .createdByName(a.getCreatedBy() != null
                        ? a.getCreatedBy().getFirstName() + " " + a.getCreatedBy().getLastName()
                        : "Systeme")
                .createdAt(a.getCreatedAt())
                .build();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RECHERCHE CHATBOT (Spring — non utilisé par Agent 2 FAISS)
    // ═══════════════════════════════════════════════════════════════════════
    public List<KbResultDTO> searchForChatbot(String problemDescription) {
        if (problemDescription == null || problemDescription.isBlank()) {
            return Collections.emptyList();
        }

        String[] keywords = Arrays.stream(
                        problemDescription.toLowerCase().split("[\\s\\p{Punct}]+"))
                .filter(w -> w.length() > 3)
                .distinct()
                .limit(10)
                .toArray(String[]::new);

        if (keywords.length == 0) return Collections.emptyList();

        Set<KnowledgeArticle> candidates = new LinkedHashSet<>();
        for (String kw : keywords) {
            candidates.addAll(repo.fullSearch(kw));
        }

        if (candidates.isEmpty()) return Collections.emptyList();

        return candidates.stream()
                .map(article -> {
                    String corpus = buildCorpus(article);
                    long score = Arrays.stream(keywords)
                            .filter(corpus::contains)
                            .count();

                    if (article.getCategory() != null &&
                            problemDescription.toLowerCase()
                                    .contains(article.getCategory().toLowerCase())) {
                        score += 2;
                    }

                    if (article.getTags() != null && !article.getTags().isBlank()) {
                        String tagsLower = article.getTags().toLowerCase();
                        long tagBonus = Arrays.stream(keywords)
                                .filter(tagsLower::contains)
                                .count();
                        score += tagBonus;
                    }

                    return new KbResultDTO(
                            article.getId(),
                            article.getTicket() != null ? article.getTicket().getId() : null,
                            article.getTitle(),
                            article.getSolution(),
                            article.getCategory(),
                            (int) score
                    );
                })
                .filter(r -> r.getSimilarityScore() > 0)
                .sorted(Comparator.comparingInt(KbResultDTO::getSimilarityScore).reversed())
                .limit(3)
                .collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VOTES
    // ═══════════════════════════════════════════════════════════════════════

    @Transactional
    public KnowledgeArticle markHelpful(Long articleId) {
        KnowledgeArticle article = findById(articleId);
        article.setHelpful(article.getHelpful() + 1);
        article.setUpdatedAt(LocalDateTime.now());
        return repo.save(article);
    }

    @Transactional
    public KnowledgeArticle markNotHelpful(Long articleId) {
        KnowledgeArticle article = findById(articleId);
        article.setNotHelpful(article.getNotHelpful() + 1);
        article.setUpdatedAt(LocalDateTime.now());
        return repo.save(article);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STATISTIQUES
    // ═══════════════════════════════════════════════════════════════════════

    public List<KnowledgeArticle> getMostViewed(int limit) {
        return repo.findAll().stream()
                .filter(a -> a.getViews() > 0)
                .sorted(Comparator.comparingInt(KnowledgeArticle::getViews).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    public List<KnowledgeArticle> getMostHelpful(int limit) {
        return repo.findAll().stream()
                .filter(a -> a.getHelpful() > 0)
                .sorted(Comparator.comparingInt(KnowledgeArticle::getHelpful).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HELPERS PRIVÉS
    // ═══════════════════════════════════════════════════════════════════════

    private String buildCorpus(KnowledgeArticle article) {
        StringBuilder sb = new StringBuilder();
        if (article.getTitle()    != null) sb.append(article.getTitle()).append(" ");
        if (article.getProblem()  != null) sb.append(article.getProblem()).append(" ");
        if (article.getSolution() != null) sb.append(article.getSolution()).append(" ");
        if (article.getCategory() != null) sb.append(article.getCategory()).append(" ");
        if (article.getTags()     != null) sb.append(article.getTags()).append(" ");
        return sb.toString().toLowerCase();
    }

    public Long resolveCategoryId(String categoryName) {
        return categoryRepository.findAll().stream()
                .filter(c -> c.getName().equalsIgnoreCase(categoryName))
                .map(c -> c.getId())
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Categorie introuvable : " + categoryName));
    }

    public Long resolvePriorityId(String priorityName) {
        return priorityRepository.findAll().stream()
                .filter(p -> p.getName().equalsIgnoreCase(priorityName))
                .map(p -> p.getId())
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Priorite introuvable : " + priorityName));
    }

    public String getAllCategoryNames() {
        return categoryRepository.findAll().stream()
                .map(c -> c.getName())
                .collect(Collectors.joining(", "));
    }

    public String getAllPriorityNames() {
        return priorityRepository.findAll().stream()
                .map(p -> p.getName())
                .collect(Collectors.joining(", "));
    }
}