package com.surumnotu.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "Kod bos olamaz")
        @Pattern(regexp = "\\d{6}", message = "Kod 6 haneli sayisal bir deger olmali") String token,
        @NotBlank(message = "Sifre bos olamaz")
        @Size(min = 8, message = "Sifre en az 8 karakter olmali") String newPassword
) {
}
