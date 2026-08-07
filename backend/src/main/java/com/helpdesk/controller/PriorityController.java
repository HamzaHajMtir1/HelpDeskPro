package com.helpdesk.controller;

import com.helpdesk.dto.PriorityRequest;
import com.helpdesk.entity.Priority;
import com.helpdesk.service.PriorityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/priorities")
@RequiredArgsConstructor
public class PriorityController {

    private final PriorityService priorityService;

    @PostMapping
    public ResponseEntity<Priority> create(@Valid @RequestBody PriorityRequest request) {
        return ResponseEntity.ok(priorityService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<Priority>> getAll() {
        return ResponseEntity.ok(priorityService.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<Priority>> getActive() {
        return ResponseEntity.ok(priorityService.getActive());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Priority> update(@PathVariable Long id, @Valid @RequestBody PriorityRequest request) {
        return ResponseEntity.ok(priorityService.update(id, request));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<String> toggle(@PathVariable Long id) {
        return ResponseEntity.ok(priorityService.toggle(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        return ResponseEntity.ok(priorityService.delete(id));
    }
    @GetMapping("/{id}")
    public ResponseEntity<Priority> getById(@PathVariable Long id) {
        return ResponseEntity.ok(priorityService.getById(id));
    }

}