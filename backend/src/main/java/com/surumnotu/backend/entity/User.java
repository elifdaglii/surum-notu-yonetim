package com.surumnotu.backend.entity;

import java.time.Instant;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;

    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;

    // Şifremi unuttum akışı için: kod üretilince set edilir, kullanılınca, süresi
    // dolunca ya da deneme limiti aşılınca temizlenir (tek kullanımlık).
    private String resetToken;

    private Instant resetTokenExpiry;

    // Aktif resetToken için art arda yanlış kod deneme sayacı - limit aşılınca
    // kod geçersiz kılınıyor (bkz. AuthService.MAX_RESET_ATTEMPTS). Kod her
    // yenilendiğinde veya temizlendiğinde 0'a dönüyor. Integer (primitive int
    // değil) kasıtlı: mevcut satırlarda bu kolon eklenirken NOT NULL olsaydı
    // Postgres "ALTER TABLE ... ADD COLUMN ... NOT NULL" hata verirdi (zaten
    // dolu tablo) - null, kod tarafında 0 gibi ele alınıyor.
    private Integer resetCodeAttempts;

    // Rate limiting icin: en son ne zaman yeni bir kod uretildigi. resetToken/
    // resetTokenExpiry temizlense bile (basarili sifirlama, deneme limiti vb.)
    // bu alan BİLEREK sifirlanmiyor - amac "dakikada en fazla 1 istek" penceresini
    // kod yasam dongusunden bagimsiz olarak korumak (bkz. AuthService.forgotPassword).
    private Instant resetCodeRequestedAt;
}
