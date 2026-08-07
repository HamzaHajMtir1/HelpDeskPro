package com.helpdesk.controller;

import com.helpdesk.dto.*;
import com.helpdesk.service.GroqService;
import com.helpdesk.service.KnowledgeService;
import com.helpdesk.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ChatbotController {

    private final GroqService groqService;
    private final KnowledgeService kbService;
    private final TicketService ticketService;

    @PostMapping("/message")
    public ResponseEntity<?> message(@RequestBody ChatRequestDTO req) {
        try {
            ChatResponseDTO res = new ChatResponseDTO();
            String phase = req.getPhase() != null ? req.getPhase() : "DISCOVERY";

            // Chargement dynamique des catégories/priorités
            String categories = kbService.getAllCategoryNames();
            String priorities  = kbService.getAllPriorityNames();

            // Fallback si la DB renvoie vide
            if (categories == null || categories.isBlank()) categories = "Réseau, Matériel, Logiciel, Sécurité, Autre";
            if (priorities  == null || priorities.isBlank())  priorities  = "Basse, Moyenne, Haute, Critique";

            String aiReply = groqService.callGroq(req.getMessages(), phase, categories, priorities);

            // Groq a échoué → répondre proprement sans 500
            if (aiReply == null || aiReply.isBlank()) {
                res.setPhase(phase);
                res.setReply("Désolé, le service IA est temporairement indisponible. Réessayez dans un instant.");
                return ResponseEntity.ok(res);
            }

            if ("DISCOVERY".equals(phase) && groqService.hasSearchMarker(aiReply)) {
                String keywords = groqService.extractKeywords(aiReply);
                String fullDesc = req.getMessages().stream()
                        .filter(m -> "user".equals(m.getRole()))
                        .map(ChatMessageDTO::getContent)
                        .collect(Collectors.joining(" "));

                List<KbResultDTO> results = kbService.searchForChatbot(fullDesc + " " + keywords);

                if (!results.isEmpty()) {
                    res.setPhase("KB_FOUND");
                    res.setKbResults(results);
                    res.setReply("J'ai trouvé " + results.size() +
                            " solution(s) similaire(s) dans notre base. " +
                            "Est-ce que l'une d'elles résout votre problème ?");
                } else {
                    res.setPhase("COLLECT_INFO");
                    res.setReply("Je n'ai pas trouvé de solution existante. " +
                            "Je vais créer un ticket. " +
                            "Dans quelle catégorie se situe votre problème ? (" + categories + ")");
                }
                return ResponseEntity.ok(res);
            }

            if ("COLLECT_INFO".equals(phase) && groqService.hasTicketReady(aiReply)) {
                TicketDraftDTO draft = groqService.extractDraft(aiReply);
                if (draft == null) {
                    // Le parsing JSON a échoué → continuer la collecte
                    res.setPhase("COLLECT_INFO");
                    res.setReply("Je n'ai pas pu générer le ticket. Pouvez-vous reformuler ?");
                    return ResponseEntity.ok(res);
                }
                res.setPhase("TICKET_READY");
                res.setDraft(draft);
                res.setReply("Voici le récapitulatif de votre ticket. Confirmez-vous la création ?");
                return ResponseEntity.ok(res);
            }

            res.setPhase(phase);
            res.setReply(aiReply);
            return ResponseEntity.ok(res);

        } catch (Exception e) {
            e.printStackTrace(); // ← visible dans les logs Spring Boot
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Erreur interne : " + e.getMessage(),
                    "cause", e.getClass().getSimpleName()
            ));
        }
    }

    @PostMapping("/confirm")
    public ResponseEntity<?> confirm(@RequestBody ConfirmTicketRequestDTO req) {
        try {
            TicketRequest ticketRequest = new TicketRequest();
            ticketRequest.setTitle(req.getDraft().getTitle());
            ticketRequest.setDescription(req.getDraft().getDescription());

            // ✅ Mapping sécurisé : convertir le type texte → enum valide
            String typeStr = req.getDraft().getType();
            String mappedType = mapToValidTicketType(typeStr);
            ticketRequest.setType(mappedType);

            // Résolution catégorie
            try {
                Long categoryId = kbService.resolveCategoryId(req.getDraft().getCategory());
                ticketRequest.setCategoryId(categoryId);
            } catch (Exception e) {
                ticketRequest.setCategoryId(1L);
            }

            // Résolution priorité
            try {
                Long priorityId = kbService.resolvePriorityId(req.getDraft().getPriority());
                ticketRequest.setPriorityId(priorityId);
            } catch (Exception e) {
                ticketRequest.setPriorityId(1L);
            }

            TicketResponse ticket = ticketService.create(ticketRequest, req.getUserEmail());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "ticketId", ticket.getId(),
                    "message", "Ticket #" + ticket.getId() + " créé avec succès"
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage(),
                    "details", e.toString()
            ));
        }
    }

    // ✅ Méthode helper : normalise n'importe quelle valeur vers INCIDENT ou DEMANDE
    private String mapToValidTicketType(String type) {
        if (type == null) return "INCIDENT";
        String normalized = type.toUpperCase()
                .replace("É", "E").replace("È", "E")
                .replace("Ê", "E").replace("Î", "I")
                .trim();
        // Tout ce qui n'est pas DEMANDE → INCIDENT par défaut
        if (normalized.contains("DEMANDE") || normalized.contains("REQUEST")) {
            return "DEMANDE";
        }
        return "INCIDENT"; // INCIDENT, PROBLEME, CHANGEMENT → tous → INCIDENT
    }

    // Endpoint pour marquer une solution KB comme utile (feedback)
    @PostMapping("/kb-helpful")
    public ResponseEntity<?> markHelpful(@RequestBody Map<String, Long> body) {
        Long articleId = body.get("articleId");
        if (articleId != null) {
            kbService.markHelpful(articleId);
        }
        return ResponseEntity.ok(Map.of("message", "Merci pour votre retour !"));
    }
    @PostMapping("/kb-not-helpful")
    public ResponseEntity<?> markNotHelpful(@RequestBody Map<String, Long> body) {
        Long articleId = body.get("articleId");
        if (articleId != null) {
            kbService.markNotHelpful(articleId);
        }
        return ResponseEntity.ok(Map.of("message", "Retour enregistré"));
    }

}