package com.surumnotu.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.surumnotu.backend.dto.DebugResetCodeResponse;
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

    // Varsayilan false: /api/auth/debug/reset-code SADECE bu true iken bir sey
    // dondurur (bkz. application.properties app.debug-reset-code-enabled) -
    // gercek bir deploy'da ASLA true olmamali, aksi halde herkes herhangi bir
    // kullanicinin aktif sifre sifirlama kodunu okuyabilir.
    @Value("${app.debug-reset-code-enabled:false}")
    private boolean debugResetCodeEnabled;

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
        authService.register(request.username(), request.password(), request.email());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ForgotPasswordResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request.username()));
    }

    // SADECE test/gelistirme icin (bkz. debugResetCodeEnabled) - Playwright'in gercek
    // bir email kutusunu okumadan sifirlama kodunu alabilmesi icin var. Devre disiyken
    // (varsayilan) her zaman 404 doner, kimlik dogrulamasi olsa dahi hicbir bilgi sizdirmaz.
    @GetMapping("/debug/reset-code")
    public ResponseEntity<DebugResetCodeResponse> debugResetCode(@RequestParam String username) {
        if (!debugResetCodeEnabled) {
            return ResponseEntity.notFound().build();
        }
        return authService.peekResetCode(username)
                .map(code -> ResponseEntity.ok(new DebugResetCodeResponse(code)))
                .orElseGet(() -> ResponseEntity.notFound().build());
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
