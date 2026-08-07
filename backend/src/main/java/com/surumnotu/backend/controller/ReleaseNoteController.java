package com.surumnotu.backend.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
import com.surumnotu.backend.service.HtmlExportService;
import com.surumnotu.backend.service.PdfExportService;
import com.surumnotu.backend.service.ReleaseNoteService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/release-notes")
public class ReleaseNoteController {

    private final ReleaseNoteService releaseNoteService;
    private final PdfExportService pdfExportService;
    private final HtmlExportService htmlExportService;

    public ReleaseNoteController(ReleaseNoteService releaseNoteService, PdfExportService pdfExportService,
                                  HtmlExportService htmlExportService) {
        this.releaseNoteService = releaseNoteService;
        this.pdfExportService = pdfExportService;
        this.htmlExportService = htmlExportService;
    }

    @GetMapping
    public List<ReleaseNoteResponse> getAll(@RequestParam(required = false) Long category,
                                             @RequestParam(required = false) String createdBy) {
        return releaseNoteService.getAll(category, createdBy);
    }

    @GetMapping("/search")
    public List<ReleaseNoteResponse> search(@RequestParam String query) {
        return releaseNoteService.search(query);
    }

    @GetMapping("/{id}")
    public ReleaseNoteResponse getById(@PathVariable Long id) {
        return releaseNoteService.getById(id);
    }

    @GetMapping("/{id}/export/pdf")
    public ResponseEntity<byte[]> exportPdf(@PathVariable Long id) {
        ReleaseNoteResponse note = releaseNoteService.getById(id);
        byte[] pdf = pdfExportService.generate(note);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + pdfExportService.fileName(note) + "\"")
                .body(pdf);
    }

    @GetMapping("/{id}/export/html")
    public ResponseEntity<byte[]> exportHtml(@PathVariable Long id) {
        ReleaseNoteResponse note = releaseNoteService.getById(id);
        byte[] html = htmlExportService.generate(note);

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + htmlExportService.fileName(note) + "\"")
                .body(html);
    }

    @PostMapping
    public ResponseEntity<ReleaseNoteResponse> create(@Valid @RequestBody ReleaseNoteRequest request,
                                                        Principal principal) {
        ReleaseNoteResponse created = releaseNoteService.create(request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ReleaseNoteResponse update(@PathVariable Long id, @Valid @RequestBody ReleaseNoteRequest request,
                                       Principal principal) {
        return releaseNoteService.update(id, request, principal.getName());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Principal principal) {
        releaseNoteService.delete(id, principal.getName());
        return ResponseEntity.noContent().build();
    }
}
