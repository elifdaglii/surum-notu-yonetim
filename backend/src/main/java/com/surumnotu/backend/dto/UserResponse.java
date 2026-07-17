package com.surumnotu.backend.dto;

import com.surumnotu.backend.entity.Role;

public record UserResponse(Long id, String username, Role role) {
}
