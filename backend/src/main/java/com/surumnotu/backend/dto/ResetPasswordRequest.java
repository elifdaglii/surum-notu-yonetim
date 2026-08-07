package com.surumnotu.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "Token bos olamaz") String token,
        @NotBlank(message = "Sifre bos olamaz")
        @Size(min = 8, message = "Sifre en az 8 karakter olmali") String newPassword
) {
}
