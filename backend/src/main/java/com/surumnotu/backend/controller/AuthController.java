package com.surumnotu.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.surumnotu.backend.dto.ForgotPasswordRequest;
import com.surumnotu.backend.dto.ForgotPasswordResponse;
import com.surumnotu.backend.dto.LoginRequest;
import com.surumnotu.backend.dto.LoginResponse;
import com.surumnotu.backend.dto.RegisterRequest;
import com.surumnotu.backend.dto.ResetPasswordRequest;
import com.surumnotu.backend.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request.username(), request.password()));
    }

    // Self-servis kayıt kapatıldı (önceki karar) - kullanıcı oluşturmanın tek yolu artık
    // /api/admin/users (bkz. AdminController). SecurityConfig'de bu path artık permitAll
    // DEĞİL (.anyRequest().authenticated() kuralına düşüyor), buradaki @PreAuthorize ek bir
    // savunma katmanı: sadece "giriş yapmış olmak" yetmiyor, ADMIN olmak gerekiyor - yoksa
    // herhangi bir sıradan USER da keyfi yeni hesap açabilirdi.
    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request.username(), request.password());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ForgotPasswordResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request.username()));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.username(), request.token(), request.newPassword());
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<String> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ex.getMessage());
    }
}
