package com.surumnotu.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "Kullanıcı adı boş olamaz") String username,
        @NotBlank(message = "Kod boş olamaz")
        @Pattern(regexp = "\\d{6}", message = "Kod 6 haneli sayısal bir değer olmalı") String token,
        @NotBlank(message = "Şifre boş olamaz")
        @Size(min = 8, message = "Şifre en az 8 karakter olmalı") String newPassword
) {
}
