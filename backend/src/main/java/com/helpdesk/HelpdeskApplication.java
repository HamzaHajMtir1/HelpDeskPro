package com.helpdesk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class HelpdeskApplication {

    public static void main(String[] args) {
        // ── Force la JVM en heure de Tunis (UTC+1) ──────────────────
        TimeZone.setDefault(TimeZone.getTimeZone("Africa/Tunis"));
        SpringApplication.run(HelpdeskApplication.class, args);
    }
}