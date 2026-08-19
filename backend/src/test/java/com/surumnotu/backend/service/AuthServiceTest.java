package com.surumnotu.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.surumnotu.backend.entity.Role;
import com.surumnotu.backend.entity.User;
import com.surumnotu.backend.repository.UserRepository;

// UserRepository mock - gercek veritabanina gidilmiyor. PasswordEncoder mock
// degil (repository/zaman bagimliligi degil, deterministik BCrypt yeterli).
// Sure kontrolleri Instant.now() etrafinda GORELI offsetlerle (plus/minus)
// yapiliyor - sabit bir clock enjekte etmeden de gercek sistem saatinin
// akmasina bagimli olmadan test edilebiliyor.
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final String USERNAME = "test-user";
    private static final String CORRECT_CODE = "123456";

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtService jwtService;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, jwtService);
    }

    private User userWithResetState(String token, Instant expiry, Integer attempts) {
        return User.builder()
                .id(1L)
                .username(USERNAME)
                .password(passwordEncoder.encode("originalPass1"))
                .role(Role.USER)
                .resetToken(token)
                .resetTokenExpiry(expiry)
                .resetCodeAttempts(attempts)
                .resetCodeRequestedAt(Instant.now().minus(10, ChronoUnit.MINUTES))
                .build();
    }

    @Test
    void doguKodGirildiginde_sifreDegisimiBasarili() {
        User user = userWithResetState(CORRECT_CODE, Instant.now().plus(5, ChronoUnit.MINUTES), 0);
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));

        authService.resetPassword(USERNAME, CORRECT_CODE, "brandNewPass1");

        ArgumentCaptor<User> savedUser = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(savedUser.capture());

        User updated = savedUser.getValue();
        assertThat(passwordEncoder.matches("brandNewPass1", updated.getPassword())).isTrue();
        assertThat(updated.getResetToken()).isNull();
        assertThat(updated.getResetTokenExpiry()).isNull();
        assertThat(updated.getResetCodeAttempts()).isZero();
    }

    @Test
    void yanlisKodGirildiginde_reddedilirVeDenemeSayaciArtar() {
        User user = userWithResetState(CORRECT_CODE, Instant.now().plus(5, ChronoUnit.MINUTES), 0);
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.resetPassword(USERNAME, "000000", "irrelevantPass1"))
                .isInstanceOf(InvalidResetTokenException.class)
                .hasMessage("Geçersiz kod");

        ArgumentCaptor<User> savedUser = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(savedUser.capture());
        assertThat(savedUser.getValue().getResetCodeAttempts()).isEqualTo(1);
        // Sifre degismedi.
        assertThat(passwordEncoder.matches("originalPass1", savedUser.getValue().getPassword())).isTrue();
    }

    @Test
    void besinciYanlisDenemedenSonra_kodGecersizKilinir() {
        // Daha once 4 yanlis deneme yapilmis (MAX_RESET_ATTEMPTS=5) - simdiki
        // deneme 5.si olacak ve kodu tamamen gecersiz kilmali.
        User user = userWithResetState(CORRECT_CODE, Instant.now().plus(5, ChronoUnit.MINUTES), 4);
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.resetPassword(USERNAME, "000000", "irrelevantPass1"))
                .isInstanceOf(InvalidResetTokenException.class)
                .hasMessage("Cok fazla yanlis deneme yapildi, kod gecersiz kilindi. Yeni kod isteyin");

        ArgumentCaptor<User> savedUser = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(savedUser.capture());
        User updated = savedUser.getValue();
        assertThat(updated.getResetToken()).isNull();
        assertThat(updated.getResetTokenExpiry()).isNull();
        assertThat(updated.getResetCodeAttempts()).isZero();
    }

    @Test
    void suresiDolmusKod_reddedilir() {
        User user = userWithResetState(CORRECT_CODE, Instant.now().minus(1, ChronoUnit.SECONDS), 0);
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.resetPassword(USERNAME, CORRECT_CODE, "irrelevantPass1"))
                .isInstanceOf(InvalidResetTokenException.class)
                .hasMessage("Kodun suresi doldu, yeni kod isteyin");

        ArgumentCaptor<User> savedUser = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(savedUser.capture());
        User updated = savedUser.getValue();
        assertThat(updated.getResetToken()).isNull();
        assertThat(updated.getResetTokenExpiry()).isNull();
        // Sifre degismedi - sadece expired state temizlendi.
        assertThat(passwordEncoder.matches("originalPass1", updated.getPassword())).isTrue();
    }

    @Test
    void kullaniciBulunamazsa_reddedilir() {
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.resetPassword(USERNAME, CORRECT_CODE, "irrelevantPass1"))
                .isInstanceOf(InvalidResetTokenException.class)
                .hasMessage("Geçersiz kod");

        verify(userRepository, never()).save(any());
    }
}
