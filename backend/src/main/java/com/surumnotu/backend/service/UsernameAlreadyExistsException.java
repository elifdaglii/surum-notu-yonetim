package com.surumnotu.backend.service;

public class UsernameAlreadyExistsException extends RuntimeException {

    public UsernameAlreadyExistsException(String username) {
        super("Bu kullanıcı adı zaten kullanılıyor: " + username);
    }
}
