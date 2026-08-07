package com.helpdesk.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CommentRequest {

    @NotBlank(message = "Le contenu est obligatoire")
    private String content;

    private boolean interne = false;
}