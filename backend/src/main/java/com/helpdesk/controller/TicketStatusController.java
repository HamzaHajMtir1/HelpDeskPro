package com.helpdesk.controller;

import com.helpdesk.dto.TicketStatusRequest;
import com.helpdesk.entity.TicketStatus;
import com.helpdesk.service.TicketStatusService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/statuses")
@RequiredArgsConstructor
public class TicketStatusController {

    private final TicketStatusService ticketStatusService;

    @PostMapping
    public ResponseEntity<TicketStatus> create(@Valid @RequestBody TicketStatusRequest request) {
        return ResponseEntity.ok(ticketStatusService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<TicketStatus>> getAll() {
        return ResponseEntity.ok(ticketStatusService.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<TicketStatus>> getActive() {
        return ResponseEntity.ok(ticketStatusService.getActive());
    }

    @PutMapping("/{id}")
    public ResponseEntity<TicketStatus> update(@PathVariable Long id, @Valid @RequestBody TicketStatusRequest request) {
        return ResponseEntity.ok(ticketStatusService.update(id, request));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<String> toggle(@PathVariable Long id) {
        return ResponseEntity.ok(ticketStatusService.toggle(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        return ResponseEntity.ok(ticketStatusService.delete(id));
    }
    @GetMapping("/{id}")
    public ResponseEntity<TicketStatus> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ticketStatusService.getById(id));
    }
}