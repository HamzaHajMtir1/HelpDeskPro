package com.helpdesk.controller;

import com.helpdesk.dto.Agent2Request;

import com.helpdesk.service.Agent2Service;

import lombok.RequiredArgsConstructor;

import org.springframework.http.MediaType;

import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController

@RequestMapping("/api/agent2")

@RequiredArgsConstructor

public class Agent2Controller {

    private final Agent2Service agent2Service;

    // ── Chat non-streaming (fallback) ─────────────────────────────────────────

    @PostMapping("/chat")

    @PreAuthorize("hasAnyRole('TECHNICIEN', 'ADMIN')")

    public ResponseEntity<?> chat(@RequestBody Agent2Request request) {

        try {

            Map<String, Object> payload = buildPayload(request, false);

            return ResponseEntity.ok(agent2Service.chat(payload));

        } catch (Exception e) {

            return ResponseEntity.internalServerError()

                    .body(Map.of("error", e.getMessage()));

        }

    }

    // ── Chat streaming SSE ─────────────────────────────────────────────────────

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)

    @PreAuthorize("hasAnyRole('TECHNICIEN', 'ADMIN')")

    public SseEmitter chatStream(@RequestBody Agent2Request request) {

        // Timeout long pour les réponses Mistral (2 minutes max)

        SseEmitter emitter = new SseEmitter(120_000L);

        boolean isExternal = request.getSearchExternal() != null && request.getSearchExternal();

        Map<String, Object> payload = buildPayload(request, isExternal);

        // Lance le proxy SSE dans un thread séparé

        agent2Service.chatStream(payload, emitter);

        return emitter;

    }

    // ── Historique ─────────────────────────────────────────────────────────────

    @GetMapping("/history/{incidentId}")

    @PreAuthorize("hasAnyRole('TECHNICIEN', 'ADMIN')")

    public ResponseEntity<?> history(@PathVariable Long incidentId) {

        return ResponseEntity.ok(agent2Service.getHistory(incidentId));

    }

    // ── Reset session ──────────────────────────────────────────────────────────

    @DeleteMapping("/reset/{incidentId}")

    @PreAuthorize("hasAnyRole('TECHNICIEN', 'ADMIN')")

    public ResponseEntity<?> reset(@PathVariable Long incidentId) {

        return ResponseEntity.ok(agent2Service.reset(incidentId));

    }

    // ── Helper ─────────────────────────────────────────────────────────────────

    private Map<String, Object> buildPayload(Agent2Request request, boolean searchExternal) {

        return Map.of(

                "incident_id",     request.getIncidentId(),

                "question",        request.getQuestion() != null ? request.getQuestion() : "",

                "category",        request.getCategory() != null ? request.getCategory() : "",

                "search_external", searchExternal,

                "incident",        request.getIncident() != null ? request.getIncident() : Map.of()

        );

    }

}