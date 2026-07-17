package com.surumnotu.backend.dto;

import com.surumnotu.backend.entity.Role;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank(message = "Kullanici adi bos olamaz") String username,
        @NotBlank(message = "Sifre bos olamaz")
        @Size(min = 8, message = "Sifre en az 8 karakter olmali") String password,
        @NotNull(message = "Rol secilmelidir") Role role
) {
}
