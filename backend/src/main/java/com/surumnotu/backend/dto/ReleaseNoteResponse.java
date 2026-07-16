package com.surumnotu.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ReleaseNoteResponse(
        Long id,
        String version,
        LocalDate releaseDate,
        String contentMarkdown,
        CategoryResponse category,
        String createdByUsername,
        LocalDateTime createdAt
) {
}
