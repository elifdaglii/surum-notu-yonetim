package com.surumnotu.backend.dto;

import com.surumnotu.backend.entity.Role;

public record LoginResponse(String token, Role role) {
}
