package com.surumnotu.backend.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ReleaseNoteRequest(
        @NotBlank(message = "Versiyon bos olamaz") String version,
        @NotNull(message = "Yayin tarihi bos olamaz") LocalDate releaseDate,
        @NotBlank(message = "Icerik bos olamaz") String contentMarkdown,
        Long categoryId
) {
}
