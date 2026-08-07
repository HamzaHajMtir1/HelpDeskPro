// dto/ChangePasswordRequest.java
package com.helpdesk.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordRequest {
    @NotBlank
    @Size(min = 6)
    private String oldPassword;
    private String newPassword;
}