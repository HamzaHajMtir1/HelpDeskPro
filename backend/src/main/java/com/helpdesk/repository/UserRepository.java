// repository/UserRepository.java
package com.helpdesk.repository;

import com.helpdesk.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(User.Role role);


    // ── Attribution automatique ──
    List<User> findByRoleAndSpecialtyCategory_Id(User.Role role, Long categoryId);
}