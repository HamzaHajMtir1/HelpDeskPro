package com.helpdesk.service;

import com.helpdesk.dto.SystemSettingsRequest;
import com.helpdesk.dto.SystemSettingsResponse;
import com.helpdesk.entity.SystemSetting;
import com.helpdesk.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SystemSettingService {

    private final SystemSettingRepository repo;

    // ── Lecture d'une clé avec valeur par défaut ──────────────────────
    private String get(String key, String def) {
        return repo.findById(key)
                .map(SystemSetting::getValue)
                .filter(v -> v != null && !v.isBlank()) // ignore les valeurs vides en DB
                .orElse(def);
    }

    // ── Écriture d'une clé : ignore null ET blank ─────────────────────
    // Cela empêche d'écraser une valeur existante avec une chaîne vide
    private void set(String key, String value) {
        if (value == null || value.isBlank()) return;
        repo.save(SystemSetting.builder()
                .key(key)
                .value(value.trim())
                .build());
    }

    // ── Écriture forcée : accepte les chaînes non-null (pour les booléens) ──
    // Utilisé pour les champs qui peuvent légitimement valoir "false"
    private void setForced(String key, String value) {
        if (value == null) return;
        repo.save(SystemSetting.builder()
                .key(key)
                .value(value.trim())
                .build());
    }

    // ════════════════════════════════════════════════════════════════════
    //  GET — retourne tous les settings (jamais le mot de passe SMTP)
    // ════════════════════════════════════════════════════════════════════
    public SystemSettingsResponse getSettings() {
        String storedPwd = repo.findById("smtp_password")
                .map(SystemSetting::getValue)
                .orElse("");
        boolean pwdSet = storedPwd != null && !storedPwd.isBlank();

        return SystemSettingsResponse.builder()
                // Général
                .companyName   (get("company_name",    "Help Desk IT"))
                .companySlogan (get("company_slogan",   "Système de support"))
                .ticketPrefix  (get("ticket_prefix",    "TKT"))
                .logoText      (get("logo_text",        "Help Desk IT"))
                // Notifications
                .notifNewTicket      (get("notif_new_ticket",      "true"))
                .notifTicketAssigned (get("notif_ticket_assigned", "true"))
                .notifNewComment     (get("notif_new_comment",     "true"))
                .notifTicketResolved (get("notif_ticket_resolved", "true"))
                .notifSlaBreached    (get("notif_sla_breached",    "true"))
                .notifSlaBefore30    (get("notif_sla_before_30",   "true"))
                .notifUnassigned1h   (get("notif_unassigned_1h",   "true"))
                .notifDailyReport    (get("notif_daily_report",    "false"))
                // Sécurité
                .sessionTimeout    (get("session_timeout",      "30"))
                .maxLoginAttempts  (get("max_login_attempts",   "5"))
                .passwordMinLength (get("password_min_length",  "6"))
                .requireUppercase  (get("require_uppercase",    "false"))
                .requireNumbers    (get("require_numbers",      "false"))
                .requireSpecialChar(get("require_special_char", "false"))
                // Email SMTP — mot de passe jamais retourné
                .smtpHost      (get("smtp_host",  "smtp.gmail.com"))
                .smtpPort      (get("smtp_port",  "587"))
                .smtpUser      (get("smtp_user",  ""))
                .fromName      (get("from_name",  "Help Desk IT"))
                .fromEmail     (get("from_email", ""))
                .smtpPasswordSet(pwdSet)
                .build();
    }

    // ════════════════════════════════════════════════════════════════════
    //  PUT — met à jour les settings
    //  Règles :
    //    - set()       : ignore null et blank → ne peut PAS vider une valeur
    //    - setForced() : ignore seulement null → utilisé pour les booléens
    //                    qui peuvent valoir "false" (non-blank mais logiquement faux)
    //    - smtpPassword : mis à jour UNIQUEMENT si non vide
    // ════════════════════════════════════════════════════════════════════
    public SystemSettingsResponse updateSettings(SystemSettingsRequest req) {

        // Général — set() : un ticketPrefix vide est IGNORE, la valeur DB est conservée
        set("company_name",   req.getCompanyName());
        set("company_slogan", req.getCompanySlogan());
        set("ticket_prefix",  req.getTicketPrefix());
        set("logo_text",      req.getLogoText());

        // Notifications — setForced() car "false" est une valeur valide
        setForced("notif_new_ticket",      req.getNotifNewTicket());
        setForced("notif_ticket_assigned", req.getNotifTicketAssigned());
        setForced("notif_new_comment",     req.getNotifNewComment());
        setForced("notif_ticket_resolved", req.getNotifTicketResolved());
        setForced("notif_sla_breached",    req.getNotifSlaBreached());
        setForced("notif_sla_before_30",   req.getNotifSlaBefore30());
        setForced("notif_unassigned_1h",   req.getNotifUnassigned1h());
        setForced("notif_daily_report",    req.getNotifDailyReport());

        // Sécurité — setForced() pour les booléens
        set("session_timeout",     req.getSessionTimeout());
        set("max_login_attempts",  req.getMaxLoginAttempts());
        set("password_min_length", req.getPasswordMinLength());
        setForced("require_uppercase",    req.getRequireUppercase());
        setForced("require_numbers",      req.getRequireNumbers());
        setForced("require_special_char", req.getRequireSpecialChar());

        // Email SMTP — set() pour host/port/user (ne pas vider accidentellement)
        set("smtp_host",  req.getSmtpHost());
        set("smtp_port",  req.getSmtpPort());
        set("smtp_user",  req.getSmtpUser());
        set("from_name",  req.getFromName());
        set("from_email", req.getFromEmail());

        // Mot de passe SMTP — sauvegardé UNIQUEMENT si explicitement fourni
        if (req.getSmtpPassword() != null && !req.getSmtpPassword().isBlank()) {
            repo.save(SystemSetting.builder()
                    .key("smtp_password")
                    .value(req.getSmtpPassword().trim())
                    .build());
        }

        return getSettings();
    }
}