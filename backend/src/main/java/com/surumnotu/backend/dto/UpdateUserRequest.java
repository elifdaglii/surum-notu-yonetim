package com.surumnotu.backend.dto;

import com.surumnotu.backend.entity.Role;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @NotBlank(message = "Kullanıcı adı boş olamaz") String username,
        // Opsiyonel: null/bos birakilirsa sifre degismez - sadece doluysa (ve o zaman
        // en az 8 karakter olmasi gerekir) guncellenir. Frontend bos alani null olarak gonderiyor.
        @Size(min = 8, message = "Şifre en az 8 karakter olmalı") String password,
        @NotNull(message = "Rol seçilmelidir") Role role,
        // Opsiyonel: doluysa sifremi unuttum akisinda kod bu adrese gonderilir.
        @Email(message = "Geçerli bir email adresi girin") String email
) {
}
