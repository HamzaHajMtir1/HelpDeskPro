package com.helpdesk.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.helpdesk.dto.ChatMessageDTO;
import com.helpdesk.dto.TicketDraftDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class GroqService {

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.api.url}")
    private String apiUrl;

    @Value("${groq.model}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    // ─── PROMPT PHASE 1 : Comprendre le problème (statique) ─────────────────
    private static final String PROMPT_DISCOVERY = """
        Tu es un assistant HelpDesk intelligent et bienveillant.
        
        PHASE ACTUELLE : DISCOVERY
        Ton objectif : comprendre le problème du client en 2-3 questions MAX.
        
        Questions à poser UNE PAR UNE :
        1. Demander une description claire du problème
        2. Si vague, demander depuis quand et sur quel équipement/logiciel
        
        Quand tu as assez d'informations pour rechercher une solution (après 1-2 échanges),
        génère EXACTEMENT ce marqueur et rien d'autre :
        
        ###SEARCH###
        {"keywords": "mots clés du problème séparés par espace"}
        ###END###
        
        Règles :
        - UNE seule question par message
        - Sois concis et naturel
        - Réponds toujours en français
        - Ne demande PAS la catégorie ou priorité dans cette phase
        """;

    // ─── PROMPT PHASE 2 : dynamique avec vraies valeurs depuis la DB ─────────
    private String buildCollectPrompt(String categories, String priorities) {
        return """
            Tu es un assistant HelpDesk. Le client a confirmé que les solutions proposées
            ne résolvent pas son problème. Tu dois maintenant collecter les informations
            pour créer un ticket de support.
            
            PHASE ACTUELLE : COLLECT_INFO
            Collecte ces 3 informations UNE PAR UNE :
            
            1. CATÉGORIE — choisis EXACTEMENT l'une de ces valeurs (copie mot pour mot, respecte les accents) :
               [%s]
            
            2. PRIORITÉ — choisis EXACTEMENT l'une de ces valeurs (copie mot pour mot) :
               [%s]
               Guide d'aide au choix :
               - Basse / Faible   : gêne mineure, le travail reste possible
               - Moyenne / Normale : impact sur le travail mais pas bloquant
               - Haute / Élevée   : blocage important, travail difficile
               - Critique / Urgente : système en panne totale, arrêt complet
            
            3. TYPE — choisis parmi : [Incident, Demande]
            
            Quand tu as les 3 informations, génère EXACTEMENT ce bloc (respecte les majuscules et accents) :
            
            ###TICKET_READY###
            {
              "title": "titre court basé sur le problème décrit (max 60 caractères)",
              "description": "description complète et détaillée du problème",
              "category": "valeur EXACTE copiée depuis la liste catégories ci-dessus",
              "priority": "valeur EXACTE copiée depuis la liste priorités ci-dessus",
              "type": "valeur EXACTE depuis [Incident, Demande]"
            }
            ###END###
            
            ⚠️ IMPORTANT :
            - Copie les valeurs de catégorie et priorité MOT POUR MOT depuis les listes.
            - Ne traduis pas, ne modifie pas la casse, ne crée pas de nouvelles valeurs.
            - Réponds toujours en français.
            - UNE seule question à la fois.
            - Dans le champ "description", n'utilise PAS de retours à la ligne. Écris tout sur une seule ligne.
            """.formatted(categories, priorities);
    }

    // ─── Appel Groq avec catégories/priorités dynamiques ────────────────────
    public String callGroq(List<ChatMessageDTO> history, String phase,
                           String categories, String priorities) {
        try {
            if (history == null || history.isEmpty()) {
                return "Bonjour ! Comment puis-je vous aider ?";
            }

            String systemPrompt = "COLLECT_INFO".equals(phase)
                    ? buildCollectPrompt(categories, priorities)
                    : PROMPT_DISCOVERY;

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));

            history.stream()
                    .filter(m -> m.getRole() != null && m.getContent() != null)
                    .forEach(m -> messages.add(Map.of("role", m.getRole(), "content", m.getContent())));

            Map<String, Object> body = Map.of(
                    "model", model,
                    "temperature", 0.1,
                    "max_tokens", 512,
                    "messages", messages
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> resp = restTemplate.postForEntity(apiUrl, request, String.class);

            if (resp.getBody() == null) {
                return "Désolé, réponse vide de l'IA. Réessayez.";
            }

            JsonNode root = mapper.readTree(resp.getBody());
            JsonNode choices = root.path("choices");
            if (choices.isEmpty()) {
                System.err.println("❌ Groq error response: " + resp.getBody());
                return "Désolé, une erreur s'est produite. Réessayez.";
            }

            return choices.get(0).path("message").path("content").asText();

        } catch (Exception e) {
            System.err.println("❌ callGroq exception: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            return "Désolé, le service IA est indisponible. Réessayez.";
        }
    }

    // ─── Ancienne signature gardée pour compatibilité (fallback sans DB) ────
    public String callGroq(List<ChatMessageDTO> history, String phase) {
        return callGroq(history, phase, "Réseau, Matériel, Logiciel, Sécurité, Autre", "Haute, Critique, Moyenne, Basse");
    }

    // ─── Parseurs des marqueurs ──────────────────────────────────────────────
    public boolean hasSearchMarker(String text) {
        return text != null && text.contains("###SEARCH###");
    }

    public String extractKeywords(String text) {
        try {
            String json = text.split("###SEARCH###")[1].split("###END###")[0].trim();
            return mapper.readTree(json).path("keywords").asText();
        } catch (Exception e) {
            return "";
        }
    }

    public boolean hasTicketReady(String text) {
        return text != null && text.contains("###TICKET_READY###");
    }

    // ─── ✅ CORRIGÉ : sanitise le JSON avant parsing ─────────────────────────
    public TicketDraftDTO extractDraft(String text) {
        try {
            String json = text.split("###TICKET_READY###")[1].split("###END###")[0].trim();
            String clean = sanitizeJsonString(json);
            return mapper.readValue(clean, TicketDraftDTO.class);
        } catch (Exception e) {
            System.err.println("❌ extractDraft error: " + e.getMessage());
            return null;
        }
    }

    // Échappe les caractères de contrôle littéraux dans les valeurs JSON
    private String sanitizeJsonString(String json) {
        StringBuilder sb = new StringBuilder(json.length());
        boolean inString = false;
        boolean escape   = false;
        for (int i = 0; i < json.length(); i++) {
            char c = json.charAt(i);
            if (escape)    { sb.append(c); escape = false; continue; }
            if (c == '\\') { sb.append(c); escape = true;  continue; }
            if (c == '"')  { sb.append(c); inString = !inString; continue; }
            if (inString) {
                if      (c == '\n') { sb.append("\\n");  continue; }
                else if (c == '\r') { sb.append("\\r");  continue; }
                else if (c == '\t') { sb.append("\\t");  continue; }
            }
            sb.append(c);
        }
        return sb.toString();
    }
}