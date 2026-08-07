package com.helpdesk.dto;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class UpdateUserRequest {

    private String firstName;
    private String lastName;
    private String company;
    private String phone;

    @Email
    private String email;

    private String role; // "ADMIN", "TECHNICIEN", "CLIENT"
    private Long specialtyCategoryId; // ← ajoute
}