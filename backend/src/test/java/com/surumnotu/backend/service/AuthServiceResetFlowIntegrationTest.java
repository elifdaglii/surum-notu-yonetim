package com.surumnotu.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.transaction.annotation.Transactional;

import com.surumnotu.backend.dto.ForgotPasswordResponse;
import com.surumnotu.backend.entity.Role;
import com.surumnotu.backend.entity.User;
import com.surumnotu.backend.repository.UserRepository;

// @Transactional: her test sonunda DB degisiklikleri rollback edilir, gercek Postgres
// (application.properties'teki ayni datasource) kirlenmeden kullanilabiliyor.
@SpringBootTest
@Transactional
@DirtiesContext
class AuthServiceResetFlowIntegrationTest {

    private static final Pattern SIX_DIGIT = Pattern.compile("\\d{6}");

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User createUser(String username) {
        User user = User.builder()
                .username(username)
                .password(passwordEncoder.encode("originalPass1"))
                .role(Role.USER)
                .build();
        return userRepository.save(user);
    }

    @Test
    void forgotPassword_generates6DigitNumericCode() {
        createUser("test-code-format");

        ForgotPasswordResponse response = authService.forgotPassword("test-code-format");

        assertThat(response.token()).isNotNull();
        assertThat(SIX_DIGIT.matcher(response.token()).matches()).isTrue();
    }

    @Test
    void forgotPassword_rateLimitsRepeatedRequests() {
        createUser("test-rate-limit");

        ForgotPasswordResponse first = authService.forgotPassword("test-rate-limit");
        ForgotPasswordResponse second = authService.forgotPassword("test-rate-limit");

        assertThat(first.token()).isNotNull();
        // Ayni pencerede (1 dk) ikinci istek kod uretmemeli, ama yanit sekli
        // (mesaj) "kullanici yok" durumuyla ayni kalmali (enumeration'a karsi).
        assertThat(second.token()).isNull();
        assertThat(second.message()).isEqualTo(first.message());
    }

    @Test
    void resetPassword_expiredCode_throwsDistinctMessage() {
        User user = createUser("test-expiry");
        ForgotPasswordResponse response = authService.forgotPassword("test-expiry");

        // Kodu gecmise atarak suresini "dolmus" hale getiriyoruz.
        user.setResetTokenExpiry(Instant.now().minusSeconds(1));
        userRepository.save(user);

        assertThatThrownBy(() -> authService.resetPassword("test-expiry", response.token(), "newValidPass1"))
                .isInstanceOf(InvalidResetTokenException.class)
                .hasMessage("Kodun suresi doldu, yeni kod isteyin");
    }

    @Test
    void resetPassword_fiveWrongAttempts_invalidatesCode() {
        createUser("test-attempts");
        ForgotPasswordResponse response = authService.forgotPassword("test-attempts");

        for (int i = 0; i < 4; i++) {
            assertThatThrownBy(() -> authService.resetPassword("test-attempts", "000000", "irrelevantPass1"))
                    .isInstanceOf(InvalidResetTokenException.class)
                    .hasMessage("Gecersiz kod");
        }

        // 5. yanlis deneme: kod artik gecersiz kilinmali, farkli bir mesajla.
        assertThatThrownBy(() -> authService.resetPassword("test-attempts", "000000", "irrelevantPass1"))
                .isInstanceOf(InvalidResetTokenException.class)
                .hasMessage("Cok fazla yanlis deneme yapildi, kod gecersiz kilindi. Yeni kod isteyin");

        // Dogru kod bile artik kabul edilmemeli - kod tamamen gecersiz kilindi.
        assertThatThrownBy(() -> authService.resetPassword("test-attempts", response.token(), "irrelevantPass1"))
                .isInstanceOf(InvalidResetTokenException.class)
                .hasMessage("Gecersiz kod");
    }

    @Test
    void resetPassword_correctCode_updatesPasswordAndIsSingleUse() {
        createUser("test-single-use");
        ForgotPasswordResponse response = authService.forgotPassword("test-single-use");

        authService.resetPassword("test-single-use", response.token(), "brandNewPass1");

        User updated = userRepository.findByUsername("test-single-use").orElseThrow();
        assertThat(passwordEncoder.matches("brandNewPass1", updated.getPassword())).isTrue();
        assertThat(updated.getResetToken()).isNull();
        assertThat(updated.getResetTokenExpiry()).isNull();

        // Ayni kod ikinci kez kullanilmaya calisilirsa artik gecersiz olmali.
        assertThatThrownBy(() -> authService.resetPassword("test-single-use", response.token(), "anotherPass1"))
                .isInstanceOf(InvalidResetTokenException.class)
                .hasMessage("Gecersiz kod");
    }
}
