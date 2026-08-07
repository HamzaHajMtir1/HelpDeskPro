package com.helpdesk.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity
@Table(name = "password_reset_tokens")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    //Email de l'utilisateur qui demande le reset
    @Column(nullable = false)
    private String email;
    // Code OTP à 6 chiffres envoyé par email
    @Column(nullable = false)
    private String code;

    // Date d'expiration — valide 15 minutes
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    // true si le code a déjà été utilisé
    @Column(nullable = false)
    private boolean used = false;

}