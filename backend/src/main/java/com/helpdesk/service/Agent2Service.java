package com.helpdesk.service;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;

import org.springframework.http.*;

import org.springframework.stereotype.Service;

import org.springframework.web.client.RestTemplate;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.BufferedReader;

import java.io.InputStreamReader;

import java.io.OutputStream;

import java.net.HttpURLConnection;

import java.net.URL;

import java.nio.charset.StandardCharsets;

import java.util.Map;

@Service

@RequiredArgsConstructor

public class Agent2Service {

    private final RestTemplate restTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${agent2.url:http://localhost:5002}")

    private String agent2Url;

    // ── Chat non-streaming (fallback) ─────────────────────────────────────────

    public Map<?, ?> chat(Map<String, Object> payload) {

        HttpHeaders headers = new HttpHeaders();

        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(

                agent2Url + "/agent2/chat",

                entity,

                Map.class

        );

        return response.getBody();

    }

    // ── Chat streaming SSE ─────────────────────────────────────────────────────

    // RestTemplate bufferise tout avant d'envoyer → inutilisable pour SSE.

    // On utilise HttpURLConnection natif pour lire le flux ligne par ligne.

    public void chatStream(Map<String, Object> payload, SseEmitter emitter) {

        Thread thread = new Thread(() -> {

            HttpURLConnection conn = null;

            try {

                String jsonBody = objectMapper.writeValueAsString(payload);

                URL url = new URL(agent2Url + "/agent2/chat/stream");

                conn = (HttpURLConnection) url.openConnection();

                conn.setRequestMethod("POST");

                conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");

                conn.setRequestProperty("Accept", "text/event-stream");

                conn.setDoOutput(true);

                conn.setConnectTimeout(10_000);   // 10s connexion

                conn.setReadTimeout(180_000);      // 3 min lecture (Mistral peut être lent)

                // Envoyer le body JSON

                try (OutputStream os = conn.getOutputStream()) {

                    os.write(jsonBody.getBytes(StandardCharsets.UTF_8));

                    os.flush();

                }

                int status = conn.getResponseCode();

                if (status != 200) {

                    String errorMsg = "{\"type\":\"error\",\"message\":\"Serveur Flask indisponible (HTTP "

                            + status + "). Vérifiez que Flask tourne sur le port 5002.\"}";

                    emitter.send(SseEmitter.event().data(errorMsg));

                    emitter.complete();

                    return;

                }

                // Lire le flux SSE ligne par ligne et le relayer au client

                try (BufferedReader reader = new BufferedReader(

                        new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {

                    String line;

                    while ((line = reader.readLine()) != null) {

                        if (line.startsWith("data: ")) {

                            String data = line.substring(6).trim();

                            if (!data.isEmpty()) {

                                emitter.send(SseEmitter.event().data(data));

                            }

                        }

                    }

                }

                emitter.complete();

            } catch (Exception e) {

                try {

                    String msg = e.getMessage() != null

                            ? e.getMessage().replace("\"", "'").replace("\n", " ")

                            : "Erreur de connexion au serveur Flask";

                    String errorJson = "{\"type\":\"error\",\"message\":\"" + msg + "\"}";

                    emitter.send(SseEmitter.event().data(errorJson));

                    emitter.complete();

                } catch (Exception ex) {

                    emitter.completeWithError(ex);

                }

            } finally {

                if (conn != null) conn.disconnect();

            }

        }, "agent2-sse-proxy");

        thread.setDaemon(true);

        thread.start();

    }

    // ── Historique ────────────────────────────────────────────────────────────

    public Map<?, ?> getHistory(Long incidentId) {

        ResponseEntity<Map> response = restTemplate.getForEntity(

                agent2Url + "/agent2/history/" + incidentId,

                Map.class

        );

        return response.getBody();

    }

    // ── Reset session ─────────────────────────────────────────────────────────

    public Map<?, ?> reset(Long incidentId) {

        restTemplate.delete(agent2Url + "/agent2/reset/" + incidentId);

        return Map.of("success", true);

    }

}