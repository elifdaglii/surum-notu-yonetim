package com.surumnotu.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record CategoryRequest(
        @NotBlank(message = "Kategori adi bos olamaz") String name
) {
}
