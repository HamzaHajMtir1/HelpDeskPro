package com.helpdesk.repository;

import com.helpdesk.entity.KnowledgeArticle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface KnowledgeArticleRepository extends JpaRepository<KnowledgeArticle, Long> {

    List<KnowledgeArticle> findByTitleContainingIgnoreCaseOrProblemContainingIgnoreCase(
            String title, String problem);

    List<KnowledgeArticle> findByCategoryIgnoreCase(String category);

    @Query("SELECT k FROM KnowledgeArticle k WHERE " +
            "LOWER(k.title) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
            "LOWER(k.problem) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
            "LOWER(k.solution) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
            "LOWER(k.category) LIKE LOWER(CONCAT('%',:q,'%'))")
    List<KnowledgeArticle> fullSearch(@Param("q") String query);

    boolean existsByTicketId(Long ticketId);

    Optional<KnowledgeArticle> findByTicketId(Long ticketId);
}