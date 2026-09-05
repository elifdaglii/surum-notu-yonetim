package com.surumnotu.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordRequest(
        @NotBlank(message = "Kullanıcı adı boş olamaz") String username
) {
}
