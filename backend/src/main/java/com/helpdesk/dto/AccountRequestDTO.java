package com.helpdesk.dto;

import lombok.Data;

@Data
public class AccountRequestDTO {
    private String fullName;
    private String email;
    private String phone;
    private String company;   // optionnel
    private String message;   // optionnel
}