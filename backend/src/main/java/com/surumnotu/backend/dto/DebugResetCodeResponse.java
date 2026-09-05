package com.surumnotu.backend.dto;

// SADECE test/gelistirme icin (bkz. AuthController.debugResetCode) - gercek bir
// deploy'da app.debug-reset-code-enabled=false oldugu surece bu hicbir zaman
// erisilebilir olmaz.
public record DebugResetCodeResponse(String code) {
}
