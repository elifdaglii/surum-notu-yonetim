package com.surumnotu.backend.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.surumnotu.backend.dto.ReleaseNoteRequest;
import com.surumnotu.backend.dto.ReleaseNoteResponse;
import com.surumnotu.backend.service.ReleaseNoteService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/release-notes")
public class ReleaseNoteController {

    private final ReleaseNoteService releaseNoteService;

    public ReleaseNoteController(ReleaseNoteService releaseNoteService) {
        this.releaseNoteService = releaseNoteService;
    }

    @GetMapping
    public List<ReleaseNoteResponse> getAll(@RequestParam(required = false) Long category) {
        return releaseNoteService.getAll(category);
    }

    @GetMapping("/search")
    public List<ReleaseNoteResponse> search(@RequestParam String query) {
        return releaseNoteService.search(query);
    }

    @GetMapping("/{id}")
    public ReleaseNoteResponse getById(@PathVariable Long id) {
        return releaseNoteService.getById(id);
    }

    @PostMapping
    public ResponseEntity<ReleaseNoteResponse> create(@Valid @RequestBody ReleaseNoteRequest request,
                                                        Principal principal) {
        ReleaseNoteResponse created = releaseNoteService.create(request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ReleaseNoteResponse update(@PathVariable Long id, @Valid @RequestBody ReleaseNoteRequest request) {
        return releaseNoteService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        releaseNoteService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
