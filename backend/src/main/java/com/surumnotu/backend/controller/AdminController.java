package com.surumnotu.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.surumnotu.backend.dto.CreateUserRequest;
import com.surumnotu.backend.dto.UserResponse;
import com.surumnotu.backend.service.UserManagementService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserManagementService userManagementService;

    public AdminController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @GetMapping("/test")
    @PreAuthorize("hasRole('ADMIN')")
    public String test() {
        return "Merhaba admin, buraya sadece ADMIN rolu erisebilir.";
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserResponse created = userManagementService.createUser(request.username(), request.password(), request.role());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> listUsers() {
        return ResponseEntity.ok(userManagementService.listUsers());
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userManagementService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
