package com.surumnotu.backend.service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

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

    // Sifremi unuttum akisinda uretilen kodun gecerlilik suresi.
    private static final Duration RESET_TOKEN_VALIDITY = Duration.ofMinutes(15);

    // 6 haneli dogrulama kodu icin ust sinir (000000-999999).
    private static final int RESET_CODE_BOUND = 1_000_000;

    private final SecureRandom secureRandom = new SecureRandom();

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
    // enumeration'a karsi). Kod, kullanici bulunduysa dolduruluyor - email
    // gonderimi yok, dev-mode olarak dogrudan response'ta donuluyor.
    public ForgotPasswordResponse forgotPassword(String username) {
        Optional<User> maybeUser = userRepository.findByUsername(username);
        String code = null;

        if (maybeUser.isPresent()) {
            User user = maybeUser.get();
            code = generateResetCode();
            user.setResetToken(code);
            user.setResetTokenExpiry(Instant.now().plus(RESET_TOKEN_VALIDITY));
            userRepository.save(user);
        }

        return new ForgotPasswordResponse("Kullanici sistemde mevcutsa bir sifirlama kodu olusturuldu", code);
    }

    // 6 haneli, sifir dolgulu sayisal dogrulama kodu (orn. "042913") - SecureRandom
    // ile uretiliyor, tahmin edilebilirligi UUID kadar dusuk olmasa da kisa sureli
    // (15 dk) ve tek kullanimlik oldugu icin bu kabul edilebilir bir tradeoff.
    private String generateResetCode() {
        int code = secureRandom.nextInt(RESET_CODE_BOUND);
        return String.format("%06d", code);
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
