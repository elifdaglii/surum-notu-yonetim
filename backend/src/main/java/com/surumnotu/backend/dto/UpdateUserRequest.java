package com.surumnotu.backend.dto;

import com.surumnotu.backend.entity.Role;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @NotBlank(message = "Kullanici adi bos olamaz") String username,
        // Opsiyonel: null/bos birakilirsa sifre degismez - sadece doluysa (ve o zaman
        // en az 8 karakter olmasi gerekir) guncellenir. Frontend bos alani null olarak gonderiyor.
        @Size(min = 8, message = "Sifre en az 8 karakter olmali") String password,
        @NotNull(message = "Rol secilmelidir") Role role
) {
}
