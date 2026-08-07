package com.helpdesk.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettingsResponse {

    // -- General
    private String companyName;
    private String companySlogan;
    private String ticketPrefix;
    private String logoText;

    // -- Notifications
    private String notifNewTicket;
    private String notifTicketAssigned;
    private String notifNewComment;
    private String notifTicketResolved;
    private String notifSlaBreached;
    private String notifSlaBefore30;
    private String notifUnassigned1h;
    private String notifDailyReport;

    // -- Securite
    private String sessionTimeout;
    private String maxLoginAttempts;
    private String passwordMinLength;
    private String requireUppercase;
    private String requireNumbers;
    private String requireSpecialChar;

    // -- Email SMTP (mot de passe JAMAIS retourne)
    private String  smtpHost;
    private String  smtpPort;
    private String  smtpUser;
    private String  fromName;
    private String  fromEmail;

    /**
     * true  => un mot de passe SMTP est enregistre en DB
     * false => aucun mot de passe, l'admin doit le saisir
     * Le mot de passe lui-meme n'est JAMAIS retourne.
     */
    private boolean smtpPasswordSet;
}