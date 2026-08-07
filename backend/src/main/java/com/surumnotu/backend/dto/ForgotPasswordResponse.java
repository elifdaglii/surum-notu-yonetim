package com.surumnotu.backend.dto;

// token: kullanici bulunduysa uretilen reset token'i (dev-mode - email yerine
// dogrudan donuluyor); kullanici bulunamadiysa null. Username enumeration'a karsi
// message alani her iki durumda da aynidir.
public record ForgotPasswordResponse(String message, String token) {
}
