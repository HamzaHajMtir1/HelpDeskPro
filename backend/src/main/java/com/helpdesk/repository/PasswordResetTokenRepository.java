package com.helpdesk.repository;

import com.helpdesk.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

public interface PasswordResetTokenRepository
        extends JpaRepository<PasswordResetToken, Long> {

    // Cherche le dernier code valide pour cet email
    Optional<PasswordResetToken> findByEmailAndUsedFalse(String email);

    // ✅ @Modifying + @Transactional obligatoires pour DELETE custom
    @Modifying
    @Transactional
    @Query("DELETE FROM PasswordResetToken t WHERE t.email = :email")
    void deleteByEmail(String email);
}