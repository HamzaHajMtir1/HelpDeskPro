package com.helpdesk.dto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;




/**
 * Résultat renvoyé par KnowledgeService.searchForChatbot().
 * Utilisé exclusivement par le ChatbotController pour alimenter
 * le frontend en résultats de la base de connaissances.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class KbResultDTO {

    /** ID de l'article KnowledgeArticle en base */
    private Long articleId;

    /** ID du ticket source (peut être null si article créé manuellement) */
    private Long ticketId;

    /** Titre de l'article / ticket */
    private String titre;

    /** Texte de la solution */
    private String solution;

    /** Catégorie (Réseau, Matériel, Logiciel, etc.) */
    private String category;

    /**
     * Score de similarité calculé par KnowledgeService.searchForChatbot().
     * Plus il est élevé, plus l'article correspond au problème décrit.
     * Non exposé dans la réponse JSON finale si tu préfères le masquer
     * (ajouter @JsonIgnore sur ce champ).
     */
    private int similarityScore;
}