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
    private static final Duration RESET_TOKEN_VALIDITY = Duration.ofMinutes(5);

    // 6 haneli dogrulama kodu icin ust sinir (000000-999999).
    private static final int RESET_CODE_BOUND = 1_000_000;

    // Ayni hesap icin art arda izin verilen maksimum yanlis kod denemesi - asilirsa
    // kod gecersiz kilinir (bkz. resetPassword).
    private static final int MAX_RESET_ATTEMPTS = 5;

    // Rate limiting: ayni hesap icin iki kod uretme istegi arasinda beklenmesi
    // gereken minimum sure - asilmadan gelen istekler yeni kod uretmez (bkz.
    // forgotPassword).
    private static final Duration RESET_REQUEST_COOLDOWN = Duration.ofMinutes(1);

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
    // enumeration'a karsi). Kod, kullanici bulunduysa VE rate limit'e takilmadiysa
    // dolduruluyor - email gonderimi yok, dev-mode olarak dogrudan response'ta
    // donuluyor. Rate limit'e takilan istekler de (enumeration'a karsi) "kullanici
    // yok" ile birebir ayni yaniti aliyor - kod uretmeden sessizce yok sayiliyor.
    public ForgotPasswordResponse forgotPassword(String username) {
        Optional<User> maybeUser = userRepository.findByUsername(username);
        String code = null;

        if (maybeUser.isPresent()) {
            User user = maybeUser.get();
            boolean rateLimited = user.getResetCodeRequestedAt() != null
                    && user.getResetCodeRequestedAt().plus(RESET_REQUEST_COOLDOWN).isAfter(Instant.now());

            if (!rateLimited) {
                code = generateResetCode();
                user.setResetToken(code);
                user.setResetTokenExpiry(Instant.now().plus(RESET_TOKEN_VALIDITY));
                user.setResetCodeAttempts(0);
                user.setResetCodeRequestedAt(Instant.now());
                userRepository.save(user);
            }
        }

        return new ForgotPasswordResponse("Kullanici sistemde mevcutsa bir sifirlama kodu olusturuldu", code);
    }

    // 6 haneli, sifir dolgulu sayisal dogrulama kodu (orn. "042913") - SecureRandom
    // ile uretiliyor, tahmin edilebilirligi UUID kadar dusuk olmasa da kisa sureli
    // (5 dk), tek kullanimlik ve 5 yanlis denemede gecersiz kilindigi icin bu kabul
    // edilebilir bir tradeoff.
    private String generateResetCode() {
        int code = secureRandom.nextInt(RESET_CODE_BOUND);
        return String.format("%06d", code);
    }

    // Kod artik username uzerinden dogrulaniyor (once findByResetToken kullanilyordu,
    // ama yanlis kod girildiginde hangi hesabin denemesi oldugu bilinemiyordu - deneme
    // sayaci hesap bazinda tutuldugu icin username sart oldu).
    public void resetPassword(String username, String token, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new InvalidResetTokenException("Geçersiz kod"));

        if (user.getResetToken() == null) {
            throw new InvalidResetTokenException("Geçersiz kod");
        }

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(Instant.now())) {
            clearResetState(user);
            userRepository.save(user);
            throw new InvalidResetTokenException("Kodun suresi doldu, yeni kod isteyin");
        }

        if (!user.getResetToken().equals(token)) {
            int attempts = (user.getResetCodeAttempts() == null ? 0 : user.getResetCodeAttempts()) + 1;
            if (attempts >= MAX_RESET_ATTEMPTS) {
                clearResetState(user);
                userRepository.save(user);
                throw new InvalidResetTokenException(
                        "Cok fazla yanlis deneme yapildi, kod gecersiz kilindi. Yeni kod isteyin");
            }
            user.setResetCodeAttempts(attempts);
            userRepository.save(user);
            throw new InvalidResetTokenException("Geçersiz kod");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        // Tek kullanimlik: basarili sifirlamadan sonra kod temizleniyor.
        clearResetState(user);
        userRepository.save(user);
    }

    // resetToken/resetTokenExpiry/resetCodeAttempts sifirlanir - resetCodeRequestedAt
    // kasitli olarak ellenmez (rate limit penceresi kod yasam donguslunden bagimsiz).
    private void clearResetState(User user) {
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        user.setResetCodeAttempts(0);
    }
}
