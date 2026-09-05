package com.surumnotu.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.surumnotu.backend.dto.DebugResetCodeResponse;
import com.surumnotu.backend.service.AuthService;

// SADECE test/gelistirme icin (bkz. AuthService.peekResetCode) - Playwright'in gercek
// bir email kutusunu okumadan sifirlama kodunu alabilmesi icin var. Iki bagimsiz
// koruma katmani var: (1) @Profile("dev") - "prod" profili aktifken bu bean/endpoint
// Spring context'e HIC REGISTER OLMAZ, route olarak dahi mevcut degildir; (2)
// debugResetCodeEnabled flag'i - dev profilinde bile varsayilan false, sadece .env'de
// DEBUG_RESET_CODE_ENABLED=true iken bir sey doner. Ayrı bir controller'da olmasinin
// nedeni: normal AuthController (login/register/forgot-password/reset-password)
// HER profilde calismali - @Profile("dev") o class'in tepesine konsaydi butun kimlik
// dogrulama akisi prod'da devre disi kalirdi.
@RestController
@RequestMapping("/api/auth")
@Profile("dev")
public class AuthDebugController {

    private final AuthService authService;

    @Value("${app.debug-reset-code-enabled:false}")
    private boolean debugResetCodeEnabled;

    public AuthDebugController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/debug/reset-code")
    public ResponseEntity<DebugResetCodeResponse> debugResetCode(@RequestParam String username) {
        if (!debugResetCodeEnabled) {
            return ResponseEntity.notFound().build();
        }
        return authService.peekResetCode(username)
                .map(code -> ResponseEntity.ok(new DebugResetCodeResponse(code)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
