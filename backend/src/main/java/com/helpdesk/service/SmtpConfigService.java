package com.helpdesk.service;

import com.helpdesk.entity.SystemSetting;
import com.helpdesk.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

import java.util.Properties;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmtpConfigService {

    private final SystemSettingRepository repo;

    @Value("${app.smtp.host}")
    private String defaultHost;

    @Value("${app.smtp.port}")
    private String defaultPort;

    @Value("${app.smtp.user}")
    private String defaultUser;

    @Value("${app.smtp.password}")
    private String defaultPassword;

    @Value("${app.smtp.from-email}")
    private String defaultFromEmail;

    @Value("${app.smtp.from-name}")
    private String defaultFromName;

    private String get(String key, String fallback) {
        return repo.findById(key)
                .map(SystemSetting::getValue)
                .filter(v -> v != null && !v.isBlank())
                .orElse(fallback);
    }

    public String getFromName() {
        return get("from_name", defaultFromName);
    }

    public String getFromEmail() {
        return get("from_email", defaultFromEmail);
    }

    public JavaMailSenderImpl buildMailSender() {
        String host     = get("smtp_host",     defaultHost);
        String portStr  = get("smtp_port",     defaultPort);
        String user     = get("smtp_user",     defaultUser);
        String password = get("smtp_password", defaultPassword);

        if (host.isBlank() || user.isBlank() || password.isBlank()) {
            log.warn("[SMTP] Config incomplète (host={}, user={}, pwd={})",
                    host.isBlank()     ? "VIDE" : host,
                    user.isBlank()     ? "VIDE" : user,
                    password.isBlank() ? "VIDE" : "OK");
            return null;
        }

        int port;
        try {
            port = Integer.parseInt(portStr.trim());
        } catch (NumberFormatException e) {
            port = 587;
        }

        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(host);
        sender.setPort(port);
        sender.setUsername(user);
        sender.setPassword(password);
        sender.setDefaultEncoding("UTF-8");

        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth",          "true");

        if (port == 465) {
            // ✅ Port 465 = SSL direct (socketFactory)
            props.put("mail.smtp.socketFactory.port",  "465");
            props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
            props.put("mail.smtp.ssl.enable",          "true");
            props.put("mail.smtp.starttls.enable",     "false");
        } else {
            // ✅ Port 587 = STARTTLS uniquement
            // PAS de ssl.enable, PAS de socketFactory
            props.put("mail.smtp.starttls.enable",   "true");
            props.put("mail.smtp.starttls.required", "true");
            props.put("mail.smtp.ssl.protocols",     "TLSv1.2");
        }

        props.put("mail.smtp.ssl.trust",         host);
        props.put("mail.smtp.connectiontimeout", "5000");
        props.put("mail.smtp.timeout",           "5000");
        props.put("mail.smtp.writetimeout",      "5000");
        props.put("mail.debug",                  "false");

        log.info("[SMTP] Sender construit : {}:{} / {}", host, port, user);
        return sender;
    }
}