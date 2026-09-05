package com.surumnotu.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Kullanıcı adı boş olamaz") String username,
        @NotBlank(message = "Şifre boş olamaz")
        @Size(min = 8, message = "Şifre en az 8 karakter olmalı") String password,
        // Opsiyonel: doluysa sifremi unuttum akisinda kod bu adrese gonderilir.
        @Email(message = "Geçerli bir email adresi girin") String email
) {
}
