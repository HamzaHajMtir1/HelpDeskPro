package com.helpdesk.dto;

import lombok.Data;

@Data
public class SystemSettingsRequest {

    // ── Général ───────────────────────────────────
    private String companyName;
    private String companySlogan;
    private String ticketPrefix;
    private String logoText;

    // ── Notifications ─────────────────────────────
    private String notifNewTicket;
    private String notifTicketAssigned;
    private String notifNewComment;
    private String notifTicketResolved;
    private String notifSlaBreached;
    private String notifSlaBefore30;
    private String notifUnassigned1h;
    private String notifDailyReport;

    // ── Sécurité ──────────────────────────────────
    private String sessionTimeout;
    private String maxLoginAttempts;
    private String passwordMinLength;
    private String requireUppercase;
    private String requireNumbers;
    private String requireSpecialChar;

    // ── Email SMTP ────────────────────────────────
    private String smtpHost;
    private String smtpPort;
    private String smtpUser;
    /**
     * Optionnel : si null ou vide → l'ancien mot de passe est conservé.
     * Si une valeur est fournie → elle écrase l'ancien.
     */
    private String smtpPassword;
    private String fromName;
    private String fromEmail;
}