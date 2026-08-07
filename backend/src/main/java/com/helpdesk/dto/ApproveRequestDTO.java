package com.helpdesk.dto;

import lombok.Data;

@Data
public class ApproveRequestDTO {
    private String username;      // email utilisé comme login
    private String tempPassword;  // mot de passe temporaire généré côté front
    private String role;          // "CLIENT" ou "TECHNICIEN"
    private String company;       // ✅ récupéré depuis la demande
    private String phone;
    private Long specialtyCategoryId;// ✅ récupéré depuis la demande
}