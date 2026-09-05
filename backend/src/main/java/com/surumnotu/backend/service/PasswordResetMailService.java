package com.surumnotu.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class PasswordResetMailService {

    private final JavaMailSender mailSender;
    private final String fromAddress;

    public PasswordResetMailService(JavaMailSender mailSender,
            @Value("${spring.mail.username:}") String fromAddress) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
    }

    // Cagiran (AuthService.forgotPassword) exception'i bilerek yutmuyor - SMTP kimlik
    // dogrulama/baglanti hatasi oldugunda bu, kod DB'ye kaydedildikten SONRA firlar
    // (kullanici resetToken'i kaybetmez, sadece email gitmemis olur).
    public void sendResetCode(String toEmail, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("Surum Notu Yonetim Sistemi - Sifre Sifirlama Kodu");
        message.setText("""
                Sifre sifirlama talebiniz alindi.

                Dogrulama kodunuz: %s

                Bu kod 5 dakika gecerlidir ve en fazla 5 yanlis denemeye izin verir.
                Bu talebi siz yapmadiysaniz bu email'i yok sayabilirsiniz.
                """.formatted(code));

        mailSender.send(message);
    }
}
