// dto/CreateUserRequest.java
package com.helpdesk.dto;
import com.helpdesk.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateUserRequest {
    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    private String company;
    private String phone;

    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String role; // "TECHNICIEN" ou "CLIENT"
    //optionnel - null pour le client et admin
    private Long specialtyCategoryId;


}