package com.surumnotu.backend.dto;

// token: kullanici bulunduysa uretilen 6 haneli sayisal dogrulama kodu (dev-mode -
// email yerine dogrudan donuluyor); kullanici bulunamadiysa null. Username
// enumeration'a karsi message alani her iki durumda da aynidir.
public record ForgotPasswordResponse(String message, String token) {
}
