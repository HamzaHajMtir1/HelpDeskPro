// dto/LoginRequest.java
package com.helpdesk.dto;
import lombok.Data;

@Data
public class LoginRequest {
    private String email;
    private String password;
    private String ipAddress;
}