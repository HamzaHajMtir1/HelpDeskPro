package com.helpdesk.config;

import com.helpdesk.entity.Category;
import com.helpdesk.entity.Priority;
import com.helpdesk.entity.SystemSetting;
import com.helpdesk.entity.TicketStatus;
import com.helpdesk.entity.User;
import com.helpdesk.repository.CategoryRepository;
import com.helpdesk.repository.PriorityRepository;
import com.helpdesk.repository.SystemSettingRepository;
import com.helpdesk.repository.TicketStatusRepository;
import com.helpdesk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.UUID;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    /**
     * Bootstrap administrator account.
     *
     * <p>The initial password used to be a literal in this class, which
     * committed a working administrator credential to version control. It now
     * comes from {@code ADMIN_INITIAL_PASSWORD} (property
     * {@code admin.initial-password}) and is never written to the logs.
     */
    @Value("${admin.bootstrap-email:admin@helpdesk.com}")
    private String adminEmail;

    @Value("${admin.initial-password:}")
    private String adminInitialPassword;

    private final Environment environment;

    /**
     * Returns the password to use when the administrator account is created.
     *
     * <p>Only called when the account does not already exist, so an existing
     * deployment is never affected.
     *
     * @throws IllegalStateException in production when no password is
     *         configured — refusing to start is safer than seeding a
     *         predictable administrator on a public deployment.
     */
    private String resolveInitialPassword() {
        if (adminInitialPassword != null && !adminInitialPassword.isBlank()) {
            return adminInitialPassword;
        }

        if (environment.matchesProfiles("prod")) {
            throw new IllegalStateException(
                    "ADMIN_INITIAL_PASSWORD must be set to create the initial "
                    + "administrator account. Refusing to start with a "
                    + "predictable credential.");
        }

        // Non-production only: generate a strong random password so a fresh
        // local checkout still boots. The value is deliberately NOT logged;
        // reset it through the standard \"forgot password\" flow.
        String generated = UUID.randomUUID() + "-" + UUID.randomUUID();
        log.warn(">>> ADMIN_INITIAL_PASSWORD non défini : un mot de passe "
                + "aléatoire a été généré pour {}. Utilisez « mot de passe "
                + "oublié », ou définissez ADMIN_INITIAL_PASSWORD pour un "
                + "accès reproductible.", adminEmail);
        return generated;
    }

    @Bean
    CommandLineRunner initData(
            UserRepository userRepo,
            PasswordEncoder encoder,
            CategoryRepository categoryRepo,
            PriorityRepository priorityRepo,
            TicketStatusRepository statusRepo,
            SystemSettingRepository settingRepo) {

        return args -> {

            // ── Admin ──────────────────────────────────────────
            // Le mot de passe provient de ADMIN_INITIAL_PASSWORD et n'est
            // jamais journalisé. Comportement inchangé : le compte n'est créé
            // que s'il n'existe pas déjà.
            if (!userRepo.existsByEmail(adminEmail)) {
                userRepo.save(User.builder()
                        .firstName("Administrateur").lastName("Admin")
                        .email(adminEmail)
                        .password(encoder.encode(resolveInitialPassword()))
                        .role(User.Role.ADMIN)
                        .mustChangePassword(false).enabled(true)
                        .build());
                log.info(">>> Admin créé ({})", adminEmail);
            }

            // ── Catégories ─────────────────────────────────────
            if (categoryRepo.count() == 0) {
                categoryRepo.save(Category.builder()
                        .name("Réseau").description("Problèmes réseau")
                        .color("#3b82f6").active(true).build());
                categoryRepo.save(Category.builder()
                        .name("Matériel").description("Problèmes matériels")
                        .color("#f59e0b").active(true).build());
                categoryRepo.save(Category.builder()
                        .name("Logiciel").description("Problèmes logiciels")
                        .color("#8b5cf6").active(true).build());
                categoryRepo.save(Category.builder()
                        .name("Sécurité").description("Problèmes de sécurité")
                        .color("#ef4444").active(true).build());
                log.info(">>> Catégories créées");
            }

            // ── Priorités ──────────────────────────────────────
            if (priorityRepo.count() == 0) {
                priorityRepo.save(Priority.builder()
                        .name("Critique").level(1)
                        .color("#ef4444").slaHours(4).active(true).build());
                priorityRepo.save(Priority.builder()
                        .name("Haute").level(2)
                        .color("#f97316").slaHours(8).active(true).build());
                priorityRepo.save(Priority.builder()
                        .name("Moyenne").level(3)
                        .color("#f59e0b").slaHours(24).active(true).build());
                priorityRepo.save(Priority.builder()
                        .name("Basse").level(4)
                        .color("#22c55e").slaHours(72).active(true).build());
                log.info(">>> Priorités créées");
            }

            // ── Statuts ────────────────────────────────────────
            if (statusRepo.count() == 0) {
                statusRepo.save(TicketStatus.builder()
                        .name("Nouveau").displayOrder(1)
                        .color("#6b7280").finalStatus(false).active(true).build());
                statusRepo.save(TicketStatus.builder()
                        .name("En cours").displayOrder(2)
                        .color("#3b82f6").finalStatus(false).active(true).build());
                statusRepo.save(TicketStatus.builder()
                        .name("Résolu").displayOrder(3)
                        .color("#22c55e").finalStatus(false).active(true).build());
                statusRepo.save(TicketStatus.builder()
                        .name("Fermé").displayOrder(4)
                        .color("#1a1a1a").finalStatus(true).active(true).build());
                log.info(">>> Statuts créés");
            }

            // ── Paramètres généraux ────────────────────────────
            if (settingRepo.findById("ticket_prefix").isEmpty()) {
                settingRepo.save(new SystemSetting("ticket_prefix",  "TKT"));
                settingRepo.save(new SystemSetting("company_name",   "Help Desk IT"));
                settingRepo.save(new SystemSetting("company_slogan", "Système de support"));
                settingRepo.save(new SystemSetting("logo_text",      "Help Desk IT"));
                log.info(">>> Paramètres généraux initialisés");
            }

            // ── Notifications ──────────────────────────────────
            if (settingRepo.findById("notif_new_ticket").isEmpty()) {
                settingRepo.save(new SystemSetting("notif_new_ticket",      "true"));
                settingRepo.save(new SystemSetting("notif_ticket_assigned", "true"));
                settingRepo.save(new SystemSetting("notif_new_comment",     "true"));
                settingRepo.save(new SystemSetting("notif_ticket_resolved", "true"));
                settingRepo.save(new SystemSetting("notif_sla_breached",    "true"));
                settingRepo.save(new SystemSetting("notif_sla_before_30",   "true"));
                settingRepo.save(new SystemSetting("notif_unassigned_1h",   "true"));
                settingRepo.save(new SystemSetting("notif_daily_report",    "false"));
                log.info(">>> Paramètres notifications initialisés");
            }

            // ── Sécurité ───────────────────────────────────────
            if (settingRepo.findById("max_login_attempts").isEmpty()) {
                settingRepo.save(new SystemSetting("max_login_attempts",   "5"));
                settingRepo.save(new SystemSetting("password_min_length",  "8"));
                settingRepo.save(new SystemSetting("require_uppercase",    "true"));
                settingRepo.save(new SystemSetting("require_numbers",      "true"));
                settingRepo.save(new SystemSetting("require_special_char", "false"));
                settingRepo.save(new SystemSetting("session_timeout",      "30"));
                log.info(">>> Paramètres sécurité initialisés");
            }

            // ── SMTP supprimé d'ici ────────────────────────────
            // La config SMTP vient de application.properties
            // via SmtpConfigService (@Value)
            // L'admin peut toujours surcharger depuis l'interface
        };
    }
}