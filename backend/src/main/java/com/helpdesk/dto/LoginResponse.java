// dto/LoginResponse.java
package com.helpdesk.dto;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String role;
    private boolean mustChangePassword;
    private String firstName;
    private String lastName;
    private String email;          // ← ajoute
    private Long   id;
}