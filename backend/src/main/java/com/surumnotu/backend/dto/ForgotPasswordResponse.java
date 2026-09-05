package com.surumnotu.backend.dto;

// Kod artik response'ta donmuyor - kullanici bulunduysa (ve rate limit'e takilmadiysa)
// kayitli email adresine gonderiliyor (bkz. AuthService.forgotPassword,
// PasswordResetMailService). message alani kullanici bulunsun/bulunmasin her zaman
// aynidir (username enumeration'a karsi).
public record ForgotPasswordResponse(String message) {
}
