package com.helpdesk.dto;

import lombok.Data;
import java.util.Map;

@Data
public class Agent2Request {
    private Long incidentId;
    private String question;
    private String category;
    private Map<String, Object> incident;
    private Boolean searchExternal;  // ← Ajouté pour le bouton "Chercher en externe"
}