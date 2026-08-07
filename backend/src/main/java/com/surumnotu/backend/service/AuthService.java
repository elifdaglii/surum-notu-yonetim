package com.surumnotu.backend.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.surumnotu.backend.dto.ForgotPasswordResponse;
import com.surumnotu.backend.dto.LoginResponse;
import com.surumnotu.backend.entity.Role;
import com.surumnotu.backend.entity.User;
import com.surumnotu.backend.repository.UserRepository;

@Service
public class AuthService {

    // Sifremi unuttum akisinda uretilen token'in gecerlilik suresi.
    private static final Duration RESET_TOKEN_VALIDITY = Duration.ofMinutes(15);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponse login(String username, String rawPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BadCredentialsException("Kullanici adi veya sifre hatali"));

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new BadCredentialsException("Kullanici adi veya sifre hatali");
        }

        String token = jwtService.generateToken(user.getUsername());
        return new LoginResponse(token, user.getRole());
    }

    public void register(String username, String rawPassword) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new UsernameAlreadyExistsException(username);
        }

        User user = User.builder()
                .username(username)
                .password(passwordEncoder.encode(rawPassword))
                .role(Role.USER)
                .build();

        userRepository.save(user);
    }

    // Kullanici bulunamasa da her zaman ayni genel mesaji donuyoruz (username
    // enumeration'a karsi). Token, kullanici bulunduysa dolduruluyor - email
    // gonderimi yok, dev-mode olarak dogrudan response'ta donuluyor.
    public ForgotPasswordResponse forgotPassword(String username) {
        Optional<User> maybeUser = userRepository.findByUsername(username);
        String token = null;

        if (maybeUser.isPresent()) {
            User user = maybeUser.get();
            token = UUID.randomUUID().toString();
            user.setResetToken(token);
            user.setResetTokenExpiry(Instant.now().plus(RESET_TOKEN_VALIDITY));
            userRepository.save(user);
        }

        return new ForgotPasswordResponse("Kullanici sistemde mevcutsa bir sifirlama token'i olusturuldu", token);
    }

    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new InvalidResetTokenException("Gecersiz ya da suresi dolmus token"));

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(Instant.now())) {
            throw new InvalidResetTokenException("Gecersiz ya da suresi dolmus token");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        // Tek kullanimlik: basarili sifirlamadan sonra token temizleniyor.
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }
}
