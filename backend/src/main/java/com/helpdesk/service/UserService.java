package com.helpdesk.service;

import com.helpdesk.entity.Category;
import com.helpdesk.repository.CategoryRepository;
import com.helpdesk.dto.CreateUserRequest;
import com.helpdesk.dto.UpdateUserRequest;
import com.helpdesk.dto.UserResponse;
import com.helpdesk.entity.User;
import com.helpdesk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository     userRepository;
    private final PasswordEncoder    passwordEncoder;
    private final EmailService       emailService;
    private final CategoryRepository categoryRepository;

    // ─────────────────────────────────────────────
    // CREATE — appelé par l'Admin via le DTO
    // ─────────────────────────────────────────────
    @Transactional
    public User createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email déjà utilisé : " + request.getEmail());
        }

        String tempPassword = UUID.randomUUID().toString().substring(0, 10);

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(tempPassword))
                .role(User.Role.valueOf(request.getRole().toUpperCase()))
                .mustChangePassword(true)
                .enabled(true)
                .phone(request.getPhone() != null && !request.getPhone().isBlank()
                        ? request.getPhone() : null)
                .company(request.getCompany() != null && !request.getCompany().isBlank()
                        ? request.getCompany() : null)
                .build();

        if (request.getSpecialtyCategoryId() != null) {
            Category category = categoryRepository
                    .findById(request.getSpecialtyCategoryId())
                    .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));
            user.setSpecialtyCategory(category);
        }

        userRepository.save(user);

        // ✅ Email création — async, ne bloque pas la réponse
        emailService.sendCredentials(
                user.getEmail(),
                user.getFirstName() + " " + user.getLastName(),
                tempPassword
        );

        return user;
    }

    // ─────────────────────────────────────────────
    // CREATE FROM REQUEST — appelé lors de l'approbation
    // ─────────────────────────────────────────────
    @Transactional
    public User createUserFromRequest(CreateUserRequest request, String tempPassword) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email déjà utilisé : " + request.getEmail());
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(tempPassword))
                .role(User.Role.valueOf(request.getRole().toUpperCase()))
                .mustChangePassword(true)
                .enabled(true)
                .build();

        // ✅ Sauvegarde company et phone depuis la demande
        if (request.getCompany() != null) user.setCompany(request.getCompany());
        if (request.getPhone()   != null) user.setPhone(request.getPhone());

        if (request.getSpecialtyCategoryId() != null) {
            Category category = categoryRepository
                    .findById(request.getSpecialtyCategoryId())
                    .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));
            user.setSpecialtyCategory(category);
        }

        return userRepository.save(user);
        // PAS d'email ici — le controller s'en charge
    }

    // ─────────────────────────────────────────────
    // READ ALL
    // ─────────────────────────────────────────────
    public List<UserResponse> getAllUsersAsResponse() {
        return userRepository.findAll()
                .stream()
                .map(UserResponse::fromUser)
                .toList();
    }

    // ── Stats par rôle ──
    public Map<String, Long> getUserStats() {
        List<User> all = userRepository.findAll();
        return Map.of(
                "total",      (long) all.size(),
                "ADMIN",      all.stream().filter(u -> u.getRole() == User.Role.ADMIN).count(),
                "TECHNICIEN", all.stream().filter(u -> u.getRole() == User.Role.TECHNICIEN).count(),
                "CLIENT",     all.stream().filter(u -> u.getRole() == User.Role.CLIENT).count()
        );
    }

    // ─────────────────────────────────────────────
    // READ BY ID
    // ─────────────────────────────────────────────
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Utilisateur introuvable avec l'id : " + id));
    }

    // ─────────────────────────────────────────────
    // READ BY EMAIL
    // ─────────────────────────────────────────────
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException(
                        "Utilisateur introuvable avec l'email : " + email));
    }

    // ─────────────────────────────────────────────
    // READ BY ROLE
    // ─────────────────────────────────────────────
    public List<User> getUsersByRole(String role) {
        User.Role userRole = User.Role.valueOf(role.toUpperCase());
        return userRepository.findByRole(userRole);
    }

    // ─────────────────────────────────────────────
    // UPDATE — avec vérification de sécurité
    // currentUserEmail = null quand appelé par l'admin
    // ─────────────────────────────────────────────
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request,
                                   String currentUserEmail) {

        // ── Vérification sécurité ──
        if (currentUserEmail != null) {
            User currentUser = userRepository.findByEmail(currentUserEmail)
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

            // Un non-admin ne peut modifier que son propre profil
            if (currentUser.getRole() != User.Role.ADMIN
                    && !currentUser.getId().equals(id)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Vous ne pouvez modifier que votre propre profil");
            }
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Utilisateur introuvable avec l'id : " + id));

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName()  != null) user.setLastName(request.getLastName());

        if (request.getPhone() != null)
            user.setPhone(request.getPhone().isBlank() ? null : request.getPhone());
        if (request.getCompany() != null)
            user.setCompany(request.getCompany().isBlank() ? null : request.getCompany());

        if (request.getEmail() != null) {
            if (!user.getEmail().equals(request.getEmail())
                    && userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email déjà utilisé par un autre compte");
            }
            user.setEmail(request.getEmail());
        }

        if (request.getRole() != null) {
            user.setRole(User.Role.valueOf(request.getRole().toUpperCase()));
        }

        if (request.getSpecialtyCategoryId() != null) {
            Category category = categoryRepository
                    .findById(request.getSpecialtyCategoryId())
                    .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));
            user.setSpecialtyCategory(category);
        } else if (request.getRole() != null &&
                !request.getRole().equalsIgnoreCase("TECHNICIEN")) {
            user.setSpecialtyCategory(null);
        }

        return UserResponse.fromUser(userRepository.save(user));
    }

    // ─────────────────────────────────────────────
    // ENABLE / DISABLE
    // ─────────────────────────────────────────────
    @Transactional
    public String toggleUserStatus(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Utilisateur introuvable avec l'id : " + id));

        user.setEnabled(!user.isEnabled());
        userRepository.save(user);

        return user.isEnabled()
                ? "Compte activé pour "    + user.getEmail()
                : "Compte désactivé pour " + user.getEmail();
    }

    // ─────────────────────────────────────────────
    // RESET MOT DE PASSE
    // ─────────────────────────────────────────────
    @Transactional
    public String resetPassword(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Utilisateur introuvable avec l'id : " + id));

        String newTempPassword = UUID.randomUUID().toString().substring(0, 10);
        user.setPassword(passwordEncoder.encode(newTempPassword));
        user.setMustChangePassword(true);
        userRepository.save(user);

        // ✅ FIX PRINCIPAL : sendResetCode au lieu de sendCredentials
        // Les deux emails sont maintenant différents
        emailService.sendResetCode(
                user.getEmail(),
                user.getFirstName() + " " + user.getLastName(),
                newTempPassword
        );

        return "Nouveau mot de passe envoyé à " + user.getEmail();
    }

    // ─────────────────────────────────────────────
    // DELETE
    // ─────────────────────────────────────────────
    @Transactional
    public String deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("Utilisateur introuvable avec l'id : " + id);
        }
        userRepository.deleteById(id);
        return "Utilisateur supprimé avec succès";
    }

    // ─────────────────────────────────────────────
    // ASSIGN SPECIALTY
    // ─────────────────────────────────────────────
    @Transactional
    public UserResponse assignSpecialty(Long technicienId, Long categoryId) {
        User user = userRepository.findById(technicienId)
                .orElseThrow(() -> new RuntimeException("Technicien introuvable"));

        if (user.getRole() != User.Role.TECHNICIEN) {
            throw new RuntimeException("L'utilisateur n'est pas un technicien");
        }

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));

        user.setSpecialtyCategory(category);
        return UserResponse.fromUser(userRepository.save(user));
    }

    // ─────────────────────────────────────────────
    // GET TECHNICIENS BY CATEGORY
    // ─────────────────────────────────────────────
    public List<User> getTechniciensByCategory(Long categoryId) {
        return userRepository.findByRoleAndSpecialtyCategory_Id(
                User.Role.TECHNICIEN, categoryId
        );
    }
}