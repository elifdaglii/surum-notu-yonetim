package com.surumnotu.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.mail.javamail.MimeMessagePreparator;
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
    //
    // SimpleMailMessage YERINE bilerek MimeMessage + MimeMessageHelper kullaniliyor:
    // SimpleMailMessage'in govde/basliklarinin karakter kodlamasi JVM'in
    // mail.mime.charset/file.encoding sistem ayarina birakilir (platforma gore degisir,
    // garanti UTF-8 degildir) - MimeMessageHelper constructor'ina "UTF-8" acikca
    // verildiginde hem konu (subject) hem govde (body) bu kodlamayla kodlanir, Turkce
    // karakterlerin (ç, ş, ğ, ı, ö, ü) alici tarafta dogru gorunmesini garantiler.
    public void sendResetCode(String toEmail, String code) {
        MimeMessagePreparator preparator = mimeMessage -> {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("Sürüm Notu Yönetim Sistemi - Şifre Sıfırlama Kodu");
            helper.setText("""
                    Şifre sıfırlama talebiniz alındı.

                    Doğrulama kodunuz: %s

                    Bu kod 5 dakika geçerlidir ve en fazla 5 yanlış denemeye izin verir.
                    Bu talebi siz yapmadıysanız bu email'i yok sayabilirsiniz.
                    """.formatted(code));
        };

        // JavaMailSenderImpl.send(MimeMessagePreparator) preparator icindeki
        // MessagingException'i otomatik olarak uygun bir MailException alt sinifina sarar.
        mailSender.send(preparator);
    }
}
