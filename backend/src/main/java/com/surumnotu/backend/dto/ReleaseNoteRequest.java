package com.surumnotu.backend.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record ReleaseNoteRequest(
        // Frontend'deki VERSION_PATTERN (add-release-note-dialog.tsx) ile ayni kural -
        // backend bu formati bagimsiz olarak da dogruluyor, sadece UI'a guvenilmiyor
        // (birisi API'ye dogrudan istek atarsa da vX.X.X disinda bir versiyon kaydedilemesin).
        @NotBlank(message = "Versiyon boş olamaz")
        @Pattern(regexp = "^v\\d+\\.\\d+\\.\\d+$", message = "Versiyon vX.X.X formatında olmalı (örnek: v1.2.0)")
        String version,
        @NotNull(message = "Yayın tarihi boş olamaz") LocalDate releaseDate,
        @NotBlank(message = "İçerik boş olamaz") String contentMarkdown,
        Long categoryId
) {
}
