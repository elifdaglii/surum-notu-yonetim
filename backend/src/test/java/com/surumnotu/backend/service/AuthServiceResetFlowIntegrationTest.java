package com.surumnotu.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import java.time.Instant;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessagePreparator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import com.surumnotu.backend.dto.ForgotPasswordResponse;
import com.surumnotu.backend.entity.Role;
import com.surumnotu.backend.entity.User;
import com.surumnotu.backend.repository.UserRepository;

// @Transactional: her test sonunda DB degisiklikleri rollback edilir, gercek Postgres
// (application.properties'teki ayni datasource) kirlenmeden kullanilabiliyor.
// JavaMailSender @MockitoBean ile degistiriliyor - forgotPassword artik gercekten
// email gondermeye calisiyor, bu mock olmadan her test gercek Gmail SMTP'sine baglanip
// gercek bir email yollardi (yavas, aga bagimli, gercek kotayi tuketir).
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

    @MockitoBean
    private JavaMailSender javaMailSender;

    private User createUser(String username) {
        User user = User.builder()
                .username(username)
                .password(passwordEncoder.encode("originalPass1"))
                .role(Role.USER)
                .email(username + "@example.com")
                .build();
        return userRepository.save(user);
    }

    // Kod artik response'ta donmuyor (bkz. ForgotPasswordResponse) - dogrudan DB'den
    // (resetToken) okunuyor, tipki gercek akista debug endpoint'inin yaptigi gibi.
    private String readResetToken(String username) {
        return userRepository.findByUsername(username).orElseThrow().getResetToken();
    }

    @Test
    void forgotPassword_generates6DigitNumericCodeAndSendsEmail() {
        createUser("test-code-format");

        authService.forgotPassword("test-code-format");

        String token = readResetToken("test-code-format");
        assertThat(token).isNotNull();
        assertThat(SIX_DIGIT.matcher(token).matches()).isTrue();
        verify(javaMailSender, times(1)).send(any(MimeMessagePreparator.class));
    }

    @Test
    void forgotPassword_rateLimitsRepeatedRequests() {
        createUser("test-rate-limit");

        ForgotPasswordResponse first = authService.forgotPassword("test-rate-limit");
        String firstToken = readResetToken("test-rate-limit");
        ForgotPasswordResponse second = authService.forgotPassword("test-rate-limit");
        String secondToken = readResetToken("test-rate-limit");

        assertThat(firstToken).isNotNull();
        // Ayni pencerede (1 dk) ikinci istek yeni kod uretmemeli/gondermemeli, ama yanit
        // sekli (mesaj) "kullanici yok" durumuyla ayni kalmali (enumeration'a karsi).
        assertThat(secondToken).isEqualTo(firstToken);
        assertThat(second.message()).isEqualTo(first.message());
        verify(javaMailSender, times(1)).send(any(MimeMessagePreparator.class));
    }

    @Test
    void forgotPassword_emailsiKullaniciIcinGondermeyiAtlar() {
        User user = User.builder()
                .username("test-no-email")
                .password(passwordEncoder.encode("originalPass1"))
                .role(Role.USER)
                .build();
        userRepository.save(user);

        authService.forgotPassword("test-no-email");

        assertThat(readResetToken("test-no-email")).isNotNull();
        verify(javaMailSender, times(0)).send(any(MimeMessagePreparator.class));
    }

    @Test
    void forgotPassword_mailGonderimiPatlarsa_kodYineDeDbdeKaliyor() {
        createUser("test-mail-failure");
        doThrow(new MailSendException("SMTP kimlik dogrulama hatasi (test)"))
                .when(javaMailSender).send(any(MimeMessagePreparator.class));

        assertThatThrownBy(() -> authService.forgotPassword("test-mail-failure"))
                .isInstanceOf(MailSendException.class);

        // Kod, mail gonderimi patlamadan ONCE kaydedildi - kullanici debug endpoint'i
        // ya da DB uzerinden yine de sifresini sifirlayabilir.
        assertThat(readResetToken("test-mail-failure")).isNotNull();
    }

    @Test
    void resetPassword_expiredCode_throwsDistinctMessage() {
        createUser("test-expiry");
        authService.forgotPassword("test-expiry");
        String token = readResetToken("test-expiry");

        // Kodu gecmise atarak suresini "dolmus" hale getiriyoruz.
        User user = userRepository.findByUsername("test-expiry").orElseThrow();
        user.setResetTokenExpiry(Instant.now().minusSeconds(1));
        userRepository.save(user);

        assertThatThrownBy(() -> authService.resetPassword("test-expiry", token, "newValidPass1"))
                .isInstanceOf(InvalidResetTokenException.class)
                .hasMessage("Kodun süresi doldu, yeni kod isteyin");
    }

    @Test
    void resetPassword_fiveWrongAttempts_invalidatesCode() {
        createUser("test-attempts");
        authService.forgotPassword("test-attempts");
        String token = readResetToken("test-attempts");

        for (int i = 0; i < 4; i++) {
            assertThatThrownBy(() -> authService.resetPassword("test-attempts", "000000", "irrelevantPass1"))
                    .isInstanceOf(InvalidResetTokenException.class)
                    .hasMessage("Geçersiz kod");
        }

        // 5. yanlis deneme: kod artik gecersiz kilinmali, farkli bir mesajla.
        assertThatThrownBy(() -> authService.resetPassword("test-attempts", "000000", "irrelevantPass1"))
                .isInstanceOf(InvalidResetTokenException.class)
                .hasMessage("Çok fazla yanlış deneme yapıldı, kod geçersiz kılındı. Yeni kod isteyin");

        // Dogru kod bile artik kabul edilmemeli - kod tamamen gecersiz kilindi.
        assertThatThrownBy(() -> authService.resetPassword("test-attempts", token, "irrelevantPass1"))
                .isInstanceOf(InvalidResetTokenException.class)
                .hasMessage("Geçersiz kod");
    }

    @Test
    void resetPassword_correctCode_updatesPasswordAndIsSingleUse() {
        createUser("test-single-use");
        authService.forgotPassword("test-single-use");
        String token = readResetToken("test-single-use");

        authService.resetPassword("test-single-use", token, "brandNewPass1");

        User updated = userRepository.findByUsername("test-single-use").orElseThrow();
        assertThat(passwordEncoder.matches("brandNewPass1", updated.getPassword())).isTrue();
        assertThat(updated.getResetToken()).isNull();
        assertThat(updated.getResetTokenExpiry()).isNull();

        // Ayni kod ikinci kez kullanilmaya calisilirsa artik gecersiz olmali.
        assertThatThrownBy(() -> authService.resetPassword("test-single-use", token, "anotherPass1"))
                .isInstanceOf(InvalidResetTokenException.class)
                .hasMessage("Geçersiz kod");
    }
}
