package com.surumnotu.backend.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.Set;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

// Spring context'i ayaga kaldirmadan, jakarta.validation.Validator'i dogrudan
// Hibernate Validator uzerinden kullaniyoruz - @ReleaseNoteRequest'teki
// @Pattern/@NotBlank kurallarini test etmek icin Spring'e ihtiyac yok.
class ReleaseNoteRequestValidationTest {

    private static ValidatorFactory validatorFactory;
    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        validatorFactory = Validation.buildDefaultValidatorFactory();
        validator = validatorFactory.getValidator();
    }

    @AfterAll
    static void closeValidatorFactory() {
        validatorFactory.close();
    }

    private ReleaseNoteRequest requestWithVersion(String version) {
        return new ReleaseNoteRequest(version, LocalDate.now(), "icerik", 1L);
    }

    private boolean hasVersionViolation(ReleaseNoteRequest request) {
        Set<ConstraintViolation<ReleaseNoteRequest>> violations = validator.validate(request);
        return violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("version"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"v1.2.0", "v0.0.1", "v10.20.300"})
    void gecerliSemVerFormati_kabulEdilir(String version) {
        assertThat(hasVersionViolation(requestWithVersion(version))).isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {"1.2.0", "v1.2", "v1.2.0.0", "v1.2.a", "1.2"})
    void gecersizSemVerFormati_reddedilir(String version) {
        assertThat(hasVersionViolation(requestWithVersion(version))).isTrue();
    }

    @ParameterizedTest
    @NullAndEmptySource
    void bosVeyaNullVersion_reddedilir(String version) {
        assertThat(hasVersionViolation(requestWithVersion(version))).isTrue();
    }

    @Test
    void versiyonAlaniGecerliOldugundaBaskaViolationOlusmaz() {
        ReleaseNoteRequest request = requestWithVersion("v1.2.0");

        Set<ConstraintViolation<ReleaseNoteRequest>> violations = validator.validate(request);

        assertThat(violations).isEmpty();
    }
}
