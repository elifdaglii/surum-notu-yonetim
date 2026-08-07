package com.surumnotu.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordRequest(
        @NotBlank(message = "Kullanici adi bos olamaz") String username
) {
}
