package com.helpdesk.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final SmtpConfigService smtpConfigService;

    private static final String BASE_URL = "https://helpdesk.4d-gile.com";
    private static final String COLOR_PRIMARY  = "#c0392b";
    private static final String COLOR_HEADER   = "#c0392b";
    private static final String COLOR_BTN_INFO = "#2563eb";
    private static final String COLOR_BTN_OK   = "#16a34a";
    private static final String COLOR_BTN_WARN = "#d97706";

    // ════════════════════════════════════════════════════════
    //  MÉTHODE CENTRALE
    // ════════════════════════════════════════════════════════
    private void send(String to, String subject, String htmlBody) {
        JavaMailSenderImpl sender = smtpConfigService.buildMailSender();
        if (sender == null) {
            log.warn("[Email] SMTP non configuré — email non envoyé à {} (sujet: {})", to, subject);
            return;
        }
        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(wrapInTemplate(htmlBody), true);

            String fromName  = smtpConfigService.getFromName();
            String fromEmail = smtpConfigService.getFromEmail();
            if (fromEmail != null && !fromEmail.isBlank()) {
                helper.setFrom(fromEmail, fromName);
            } else {
                helper.setFrom(sender.getUsername());
            }

            sender.send(message);
            log.info("[Email] Envoyé à {} — sujet: {}", to, subject);
        } catch (Exception e) {
            log.error("[Email] Échec envoi à {} — {}", to, e.getMessage());
        }
    }

    // ════════════════════════════════════════════════════════
    //  TEST SMTP
    // ════════════════════════════════════════════════════════
    public void sendTestEmail(String to) {
        JavaMailSenderImpl sender = smtpConfigService.buildMailSender();
        if (sender == null) {
            throw new RuntimeException("SMTP non configuré en base de données");
        }
        String body =
                "<p style='color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px;'>" +
                        "Ceci est un email de test envoyé depuis la configuration SMTP de votre HelpDesk IT.</p>" +
                        alertBox("success", "La configuration SMTP fonctionne correctement.") +
                        "<p style='color:#6b7280;font-size:13px;margin:16px 0 0;'>" +
                        "Si vous recevez cet email, votre serveur SMTP est correctement configuré " +
                        "et les notifications automatiques seront bien acheminées.</p>";
        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject("HelpDesk — Vérification de la configuration SMTP");
            helper.setText(wrapInTemplate(body), true);

            String fromName  = smtpConfigService.getFromName();
            String fromEmail = smtpConfigService.getFromEmail();
            if (fromEmail != null && !fromEmail.isBlank()) {
                helper.setFrom(fromEmail, fromName);
            } else {
                helper.setFrom(sender.getUsername());
            }

            sender.send(message);
            log.info("[Email] Test SMTP envoyé à {}", to);
        } catch (Exception e) {
            log.error("[Email] Échec test SMTP : {}", e.getMessage());
            throw new RuntimeException("Échec SMTP : " + e.getMessage());
        }
    }

    // ════════════════════════════════════════════════════════
    //  TEMPLATE HTML — structure unifiée
    // ════════════════════════════════════════════════════════
    private String wrapInTemplate(String content) {
        return """
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width,initial-scale=1"/>
            </head>
            <body style="margin:0;padding:0;background:#f3f4f6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
                <tr><td align="center">
                  <table width="580" cellpadding="0" cellspacing="0"
                         style="background:#ffffff;border-radius:8px;overflow:hidden;
                                box-shadow:0 1px 4px rgba(0,0,0,0.08);">

                    <!-- Header -->
                    <tr>
                      <td style="background:%s;padding:22px 32px;">
                        <p style="margin:0;color:#ffffff;font-size:17px;font-weight:700;
                                  letter-spacing:0.4px;line-height:1;">HelpDesk IT</p>
                        <p style="margin:5px 0 0;color:rgba(255,255,255,0.6);font-size:12px;
                                  letter-spacing:0.2px;">Sindibad Group</p>
                      </td>
                    </tr>

                    <!-- Contenu -->
                    <tr>
                      <td style="padding:32px 36px;">
                        %s
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="border-top:1px solid #e5e7eb;padding:18px 36px;">
                        <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;
                                  line-height:1.6;">
                          © 2026 HelpDesk IT — Sindibad Group<br/>
                          Cet email est généré automatiquement, merci de ne pas y répondre.
                        </p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(COLOR_HEADER, content);
    }

    // ════════════════════════════════════════════════════════
    //  COMPOSANTS HTML réutilisables — style unifié
    // ════════════════════════════════════════════════════════

    private String ticketCard(String ref, String title, String status,
                              String priority, String category) {
        String statusColor = switch (status.toLowerCase()) {
            case "en cours"            -> "#2563eb";
            case "résolu"              -> "#16a34a";
            case "fermé"               -> "#6b7280";
            case "nouveau"             -> "#7c3aed";
            case "information requise" -> "#d97706";
            default                    -> "#d97706";
        };
        String priorityColor = switch (priority.toLowerCase()) {
            case "critique" -> "#dc2626";
            case "haute"    -> "#ea580c";
            case "moyenne"  -> "#d97706";
            default         -> "#16a34a";
        };

        String badges = badge(status, statusColor) + " " + (!priority.equals("—") ? badge(priority, priorityColor) : "");
        if (category != null && !category.isBlank() && !category.equals("—")) {
            badges += " " + badge(category, "#64748b");
        }

        return """
            <table width="100%%" cellpadding="0" cellspacing="0"
                   style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;
                          margin:16px 0;border-left:3px solid %s;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;
                            letter-spacing:0.3px;font-weight:600;">%s</p>
                  <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#111827;">%s</p>
                  %s
                </td>
              </tr>
            </table>
            """.formatted(priorityColor, ref, title, badges);
    }

    private String badge(String label, String color) {
        return "<span style=\"display:inline-block;padding:2px 9px;border-radius:4px;" +
                "font-size:11px;font-weight:600;color:#fff;background:" + color + ";\">" +
                label + "</span>";
    }

    private String alertBox(String type, String text) {
        String bg, border, textColor;
        switch (type) {
            case "success" -> { bg = "#f0fdf4"; border = "#86efac"; textColor = "#166534"; }
            case "warning" -> { bg = "#fffbeb"; border = "#fde68a"; textColor = "#92400e"; }
            case "danger"  -> { bg = "#fef2f2"; border = "#fca5a5"; textColor = "#991b1b"; }
            default        -> { bg = "#eff6ff"; border = "#bfdbfe"; textColor = "#1e40af"; }
        }
        return """
            <div style="background:%s;border:1px solid %s;border-radius:6px;
                        padding:13px 16px;margin:16px 0;">
              <p style="margin:0;color:%s;font-size:13px;line-height:1.6;">%s</p>
            </div>
            """.formatted(bg, border, textColor, text);
    }

    private String ctaButton(String label, String url, String color) {
        return """
            <div style="text-align:center;margin:26px 0 8px;">
              <a href="%s"
                 style="display:inline-block;padding:11px 30px;background:%s;color:#ffffff;
                        text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">
                %s
              </a>
            </div>
            """.formatted(url, color, label);
    }

    private String greeting(String fullName) {
        return "<p style=\"font-size:15px;color:#111827;margin:0 0 20px;\">" +
                "Bonjour <strong>" + fullName + "</strong>,</p>";
    }

    private String paragraph(String html) {
        return "<p style=\"color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px;\">" +
                html + "</p>";
    }

    private String infoTable(String[][] rows) {
        StringBuilder sb = new StringBuilder(
                "<table width='100%' cellpadding='0' cellspacing='0' " +
                        "style='background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;" +
                        "margin:16px 0;'><tr><td style='padding:16px 20px;'>"
        );
        for (String[] row : rows) {
            if (row[1] == null || row[1].isBlank()) continue;
            sb.append("<p style='margin:0 0 8px;font-size:13px;color:#6b7280;'>")
                    .append("<span style='color:#374151;font-weight:600;'>").append(row[0]).append("</span> — ")
                    .append("<span style='color:#111827;'>").append(row[1]).append("</span></p>");
        }
        sb.append("</td></tr></table>");
        return sb.toString();
    }

    private String signature() {
        return """
            <p style="margin:28px 0 0;color:#6b7280;font-size:13px;
                      border-top:1px solid #e5e7eb;padding-top:20px;line-height:1.6;">
              Cordialement,<br/>
              <strong style="color:#111827;">L'équipe HelpDesk IT</strong>
            </p>
            """;
    }

    // ════════════════════════════════════════════════════════
    //  1. IDENTIFIANTS — nouveau compte
    // ════════════════════════════════════════════════════════
    @Async
    public void sendCredentials(String toEmail, String fullName, String tempPassword) {
        String body = greeting(fullName) +
                paragraph("Votre compte HelpDesk IT vient d'être créé. " +
                        "Voici vos identifiants de première connexion :") +
                infoTable(new String[][]{
                        {"Email", toEmail},
                        {"Mot de passe temporaire",
                                "<span style='font-family:monospace;background:#f3f4f6;padding:1px 7px;" +
                                        "border-radius:4px;color:#b91c1c;font-weight:700;'>" + tempPassword + "</span>"}
                }) +
                alertBox("warning", "Ce mot de passe est temporaire. " +
                        "Vous serez invité à le modifier dès votre première connexion.") +
                ctaButton("Accéder à HelpDesk", BASE_URL + "/login", COLOR_PRIMARY) +
                signature();

        send(toEmail, "HelpDesk — Vos identifiants de connexion", body);
    }

    // ════════════════════════════════════════════════════════
    //  2. RÉINITIALISATION mot de passe
    // ════════════════════════════════════════════════════════
    @Async
    public void sendResetCode(String toEmail, String fullName, String newPassword) {
        String body = greeting(fullName) +
                paragraph("Votre administrateur a réinitialisé votre mot de passe. " +
                        "Voici vos nouveaux identifiants :") +
                infoTable(new String[][]{
                        {"Email", toEmail},
                        {"Nouveau mot de passe temporaire",
                                "<span style='font-family:monospace;background:#f3f4f6;padding:1px 7px;" +
                                        "border-radius:4px;color:#b91c1c;font-weight:700;'>" + newPassword + "</span>"}
                }) +
                alertBox("info", "Pour sécuriser votre compte, modifiez ce mot de passe dès votre reconnexion " +
                        "depuis votre profil.") +
                ctaButton("Se reconnecter", BASE_URL + "/login", COLOR_BTN_INFO) +
                signature();

        send(toEmail, "HelpDesk — Votre mot de passe a été réinitialisé", body);
    }

    // ════════════════════════════════════════════════════════
    //  3. ALERTE SÉCURITÉ — sujet et contenu neutralisés
    //     pour éviter les filtres anti-spam Gmail
    // ════════════════════════════════════════════════════════
    @Async
    public void sendSecurityAlert(String toEmail, String fullName,
                                  String ipAddress, String attemptTime) {
        String body = greeting(fullName) +
                paragraph("Plusieurs tentatives d'accès ont été enregistrées sur votre compte HelpDesk. " +
                        "Pour protéger vos données, votre accès a été temporairement limité pendant 15 minutes.") +
                infoTable(new String[][]{
                        {"Compte",  toEmail},
                        {"Heure",   attemptTime},
                        {"IP",      ipAddress}
                }) +
                alertBox("warning", "Si ces tentatives viennent bien de vous, patientez quelques minutes puis réessayez.") +
                alertBox("info", "Si vous n'êtes pas à l'origine de cette action, " +
                        "contactez votre administrateur ou réinitialisez votre mot de passe.") +
                ctaButton("Réinitialiser mon mot de passe", BASE_URL + "/forgot-password", COLOR_PRIMARY) +
                signature();

        send(toEmail, "HelpDesk — Notification de votre compte", body);
    }

    // ════════════════════════════════════════════════════════
    //  4. INFO REQUISE → Client
    // ════════════════════════════════════════════════════════
    @Async
    public void sendInfoRequise(String toEmail, String fullName,
                                String ticketRef, String ticketTitle,
                                String techName) {
        String body = greeting(fullName) +
                paragraph("Le technicien <strong>" + techName + "</strong> a besoin " +
                        "d'une information complémentaire pour traiter votre demande :") +
                ticketCard(ticketRef, ticketTitle, "Information requise", "—", null) +
                alertBox("info", "Connectez-vous à votre espace et répondez dans la messagerie du ticket " +
                        "pour permettre la poursuite du traitement.") +
                ctaButton("Répondre au ticket", BASE_URL + "/tickets", COLOR_BTN_WARN) +
                signature();

        send(toEmail, "HelpDesk — Information requise pour votre ticket " + ticketRef, body);
    }

    // ════════════════════════════════════════════════════════
    //  5. TICKET ASSIGNÉ → Technicien
    // ════════════════════════════════════════════════════════
    @Async
    public void sendTicketAssigne(String toEmail, String fullName,
                                  String ticketRef, String ticketTitle,
                                  String priority, String category,
                                  String clientName, String slaDeadline) {
        String body = greeting(fullName) +
                paragraph("Un nouveau ticket vous a été assigné :") +
                ticketCard(ticketRef, ticketTitle, "Nouveau", priority, category) +
                infoTable(new String[][]{
                        {"Client", clientName},
                        {"Échéance SLA", "<span style='color:#b91c1c;font-weight:600;'>" + slaDeadline + "</span>"}
                }) +
                ctaButton("Voir le ticket", BASE_URL + "/tech/tickets", COLOR_BTN_INFO) +
                signature();

        send(toEmail, "HelpDesk — Nouveau ticket assigné : " + ticketRef, body);
    }

    // ════════════════════════════════════════════════════════
    //  6. TICKET RÉSOLU → Client
    // ════════════════════════════════════════════════════════
    @Async
    public void sendTicketResolu(String toEmail, String fullName,
                                 String ticketRef, String ticketTitle,
                                 String techName) {
        String body = greeting(fullName) +
                paragraph("Votre ticket a été <strong>résolu</strong> par <strong>" + techName + "</strong> :") +
                ticketCard(ticketRef, ticketTitle, "Résolu", "—", null) +
                alertBox("success", "Si le problème est bien résolu, vous pouvez fermer le ticket depuis votre espace. " +
                        "Dans le cas contraire, vous avez la possibilité de demander une réouverture.") +
                ctaButton("Voir mon ticket", BASE_URL + "/tickets", COLOR_BTN_OK) +
                signature();

        send(toEmail, "HelpDesk — Votre ticket a été résolu : " + ticketRef, body);
    }

    // ════════════════════════════════════════════════════════
    //  7. NOUVEAU COMMENTAIRE
    // ════════════════════════════════════════════════════════
    @Async
    public void sendNouveauCommentaire(String toEmail, String fullName,
                                       String ticketRef, String ticketTitle,
                                       String auteurNom, String aperçuMessage) {
        String body = greeting(fullName) +
                paragraph("<strong>" + auteurNom + "</strong> a posté un nouveau message sur le ticket :") +
                ticketCard(ticketRef, ticketTitle, "En cours", "—", null) +
                "<div style='background:#f9fafb;border-left:3px solid #d1d5db;border-radius:0 6px 6px 0;" +
                "padding:14px 16px;margin:8px 0 20px;'>" +
                "<p style='margin:0 0 5px;font-size:11px;color:#9ca3af;text-transform:uppercase;" +
                "letter-spacing:0.4px;font-weight:600;'>Aperçu</p>" +
                "<p style='margin:0;font-size:14px;color:#374151;line-height:1.6;'>" +
                "« " + aperçuMessage + " »</p></div>" +
                ctaButton("Répondre au message", BASE_URL + "/tickets", "#7c3aed") +
                signature();

        send(toEmail, "HelpDesk — Nouveau message sur le ticket " + ticketRef, body);
    }

    // ════════════════════════════════════════════════════════
    //  8. SLA WARNING 80%
    // ════════════════════════════════════════════════════════
    @Async
    public void sendSlaWarning(String toEmail, String fullName,
                               String ticketRef, String ticketTitle,
                               String deadline, String tempsRestant) {
        String body = greeting(fullName) +
                paragraph("Le ticket suivant approche de son échéance SLA. Une action rapide est attendue :") +
                ticketCard(ticketRef, ticketTitle, "En cours", "Haute", null) +
                infoTable(new String[][]{
                        {"Échéance", deadline},
                        {"Temps restant", "<span style='color:#b45309;font-weight:700;'>" + tempsRestant + "</span>"}
                }) +
                alertBox("warning", "Merci de traiter ce ticket en priorité pour respecter l'engagement SLA.") +
                ctaButton("Traiter le ticket", BASE_URL + "/tech/tickets", COLOR_BTN_WARN) +
                signature();

        send(toEmail, "HelpDesk — Échéance SLA proche : " + ticketRef, body);
    }

    // ════════════════════════════════════════════════════════
    //  9. SLA BREACH
    // ════════════════════════════════════════════════════════
    @Async
    public void sendSlaBreach(String toEmail, String fullName,
                              String ticketRef, String ticketTitle,
                              String deadline, boolean isAdmin) {
        String body;

        if (isAdmin) {
            body = greeting(fullName) +
                    paragraph("Le ticket suivant a dépassé son délai de résolution SLA. " +
                            "En tant qu'administrateur, vous pouvez intervenir directement :") +
                    ticketCard(ticketRef, ticketTitle, "En cours", "Critique", null) +
                    infoTable(new String[][]{
                            {"Échéance SLA", "<span style='color:#b91c1c;font-weight:600;'>" + deadline + " (dépassée)</span>"}
                    }) +
                    "<p style='color:#374151;font-size:14px;line-height:1.7;margin:0 0 8px;'>" +
                    "Actions disponibles :</p>" +
                    "<ul style='color:#374151;font-size:14px;line-height:2;margin:0 0 16px;" +
                    "padding-left:20px;'>" +
                    "<li><strong>Commenter</strong> — ajouter une note d'intervention</li>" +
                    "<li><strong>Réassigner</strong> — transférer à un autre technicien</li>" +
                    "</ul>" +
                    alertBox("info", "Rendez-vous dans <strong>Gestion des SLA → Dépassements</strong> " +
                            "pour commenter ou réassigner ce ticket.") +
                    ctaButton("Intervenir", BASE_URL + "/admin/sla", COLOR_PRIMARY) +
                    signature();

            send(toEmail, "HelpDesk — Intervention requise, SLA dépassé : " + ticketRef, body);

        } else {
            body = greeting(fullName) +
                    paragraph("Le SLA du ticket suivant a été <strong>dépassé</strong>. " +
                            "Une intervention immédiate est requise :") +
                    ticketCard(ticketRef, ticketTitle, "En cours", "Critique", null) +
                    infoTable(new String[][]{
                            {"Échéance", "<span style='color:#b91c1c;font-weight:600;'>" + deadline + "</span>"}
                    }) +
                    alertBox("danger", "Ce ticket dépasse son SLA. " +
                            "Merci de le traiter en urgence ou de contacter votre administrateur.") +
                    ctaButton("Traiter maintenant", BASE_URL + "/tech/tickets", COLOR_PRIMARY) +
                    signature();

            send(toEmail, "HelpDesk — SLA dépassé : " + ticketRef, body);
        }
    }

    // ════════════════════════════════════════════════════════
    //  10. TICKET NON ASSIGNÉ → Admin
    // ════════════════════════════════════════════════════════
    @Async
    public void sendSlaUnassigned(String toEmail, String fullName,
                                  String ticketRef, String ticketTitle,
                                  String createdAt, long delayMinutes) {
        String body = greeting(fullName) +
                paragraph("Le ticket suivant n'a pas encore été pris en charge " +
                        "depuis <strong>" + delayMinutes + " minutes</strong> :") +
                ticketCard(ticketRef, ticketTitle, "Nouveau", "—", null) +
                infoTable(new String[][]{
                        {"Créé le", createdAt}
                }) +
                alertBox("info", "Veuillez assigner ce ticket à un technicien disponible " +
                        "depuis l'interface d'administration.") +
                ctaButton("Assigner le ticket", BASE_URL + "/admin/tickets", COLOR_BTN_INFO) +
                signature();

        send(toEmail, "HelpDesk — Ticket en attente d'assignation : " + ticketRef, body);
    }

    // ════════════════════════════════════════════════════════
    //  11. ESCALADE → Technicien
    // ════════════════════════════════════════════════════════
    @Async
    public void sendEscaladeNotification(String toEmail, String fullName,
                                         Long ticketId, String ticketTitle,
                                         String priorite, String categorie) {
        String ticketRef = "#TKT-" + String.format("%03d", ticketId);
        String body = greeting(fullName) +
                paragraph("Un ticket en dépassement SLA vient de vous être assigné en escalade :") +
                ticketCard(ticketRef, ticketTitle, "En cours", priorite, categorie) +
                alertBox("danger", "Ce ticket dépasse son délai SLA. " +
                        "Merci de le prendre en charge en urgence.") +
                ctaButton("Traiter en urgence", BASE_URL + "/tech/tickets", COLOR_PRIMARY) +
                signature();

        send(toEmail, "HelpDesk — Escalade : " + ticketRef, body);
    }

    // ════════════════════════════════════════════════════════
    //  12. DEMANDE DE COMPTE — Confirmation → Client
    // ════════════════════════════════════════════════════════
    @Async
    public void sendRequestConfirmation(String toEmail, String fullName) {
        String body = greeting(fullName) +
                paragraph("Merci de votre intérêt pour la plateforme <strong>HelpDesk IT</strong>. " +
                        "Votre demande de création de compte a bien été enregistrée.") +
                infoTable(new String[][]{
                        {"Nom", fullName},
                        {"Email", toEmail}
                }) +
                alertBox("info", "Notre équipe va examiner votre demande et reviendra vers vous dans les meilleurs délais. " +
                        "Vous recevrez un email avec vos identifiants dès que votre compte sera activé.") +
                signature();

        send(toEmail, "HelpDesk — Demande de compte bien reçue", body);
    }

    // ════════════════════════════════════════════════════════
    //  13. DEMANDE DE COMPTE — Rejet → Client
    // ════════════════════════════════════════════════════════
    @Async
    public void sendRequestRejected(String toEmail, String fullName, String reason) {
        String reasonBlock = (reason != null && !reason.isBlank())
                ? "<div style='background:#f9fafb;border-left:3px solid #d1d5db;" +
                "border-radius:0 6px 6px 0;padding:14px 16px;margin:12px 0 16px;'>" +
                "<p style='margin:0 0 5px;font-size:11px;color:#9ca3af;text-transform:uppercase;" +
                "letter-spacing:0.4px;font-weight:600;'>Motif communiqué</p>" +
                "<p style='margin:0;font-size:14px;color:#374151;line-height:1.6;'>" + reason + "</p>" +
                "</div>"
                : "";

        String body = greeting(fullName) +
                paragraph("Nous avons bien examiné votre demande de création de compte sur la plateforme " +
                        "<strong>HelpDesk IT</strong>. Nous ne sommes malheureusement pas en mesure " +
                        "d'y donner suite pour le moment.") +
                reasonBlock +
                alertBox("info", "Si vous pensez qu'il s'agit d'une erreur ou souhaitez davantage " +
                        "d'informations, n'hésitez pas à contacter directement notre équipe support.") +
                paragraph("Vous pouvez soumettre une nouvelle demande à tout moment.") +
                signature();

        send(toEmail, "HelpDesk — Votre demande de compte", body);
    }

    // ════════════════════════════════════════════════════════
    //  14. DEMANDE DE COMPTE — Notification → Admin
    // ════════════════════════════════════════════════════════
    @Async
    public void notifyAdminNewRequest(String adminEmail, String fullName,
                                      String clientEmail, String phone,
                                      String company, String message) {
        String messageBlock = (message != null && !message.isBlank())
                ? "<div style='background:#f9fafb;border-left:3px solid #d1d5db;" +
                "border-radius:0 6px 6px 0;padding:14px 16px;margin:12px 0 0;'>" +
                "<p style='margin:0 0 5px;font-size:11px;color:#9ca3af;text-transform:uppercase;" +
                "letter-spacing:0.4px;font-weight:600;'>Message du demandeur</p>" +
                "<p style='margin:0;font-size:14px;color:#374151;line-height:1.6;font-style:italic;'>" +
                "« " + message + " »</p></div>"
                : "";

        String body = greeting("Administrateur") +
                paragraph("Un visiteur vient de soumettre une demande de création de compte :") +
                infoTable(new String[][]{
                        {"Nom", fullName},
                        {"Email", clientEmail},
                        {"Téléphone", phone},
                        {"Entreprise", company}
                }) +
                messageBlock +
                alertBox("info", "Rendez-vous dans l'interface d'administration pour approuver ou rejeter cette demande.") +
                ctaButton("Gérer les demandes", BASE_URL + "/admin/account-requests", COLOR_PRIMARY) +
                signature();

        send(adminEmail, "HelpDesk — Nouvelle demande de compte : " + fullName, body);
    }
}