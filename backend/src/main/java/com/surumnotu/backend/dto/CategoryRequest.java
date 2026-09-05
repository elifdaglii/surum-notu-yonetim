package com.surumnotu.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record CategoryRequest(
        @NotBlank(message = "Kategori adı boş olamaz") String name
) {
}
