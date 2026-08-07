package com.helpdesk.config;

import com.helpdesk.security.JwtFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@RequiredArgsConstructor
@EnableAsync
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    @Value("${frontend_base_url}")
    private String frontend_base_url;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfig()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // ── Routes publiques ──
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers("/api/auth/forgot-password").permitAll()
                        .requestMatchers("/api/auth/verify-reset-code").permitAll()
                        .requestMatchers("/api/auth/reset-password").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/account-requests").permitAll()

                        // ── Config sécurité accessible à tous les connectés ──
                        .requestMatchers(HttpMethod.GET, "/api/admin/settings/public").authenticated()

                        // ── Routes authentifiées ──
                        .requestMatchers("/api/auth/change-password").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/account-requests").hasRole("ADMIN")
                        .requestMatchers("/api/account-requests/**").hasRole("ADMIN")

                        // ── GET référentiels accessibles à tous les connectés ──
                        .requestMatchers("/api/chatbot/**").permitAll()
                        .requestMatchers("/api/notifications/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/admin/categories/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/admin/priorities/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/admin/statuses/**").authenticated()

                        // ── Modification profil personnel ──
                        .requestMatchers(HttpMethod.PUT, "/api/admin/users/{id}").authenticated()

                        // ── Knowledge attachments ──
                        .requestMatchers(HttpMethod.POST,
                                "/api/knowledge/*/attachments").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET,
                                "/api/knowledge/*/attachments/*/download").authenticated()

                        // ── Toutes les autres routes admin réservées à l'ADMIN ──
                        .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")

                        .requestMatchers("/api/tickets/**").authenticated()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfig() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(frontend_base_url));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}