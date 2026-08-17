package com.surumnotu.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

// sanitize() disindaki hicbir seyi kullanmiyoruz, bu yuzden constructor'a
// verilen repository'ler null - sanitize() onlara hic dokunmuyor (sadece
// Jsoup.clean cagiriyor), bu yuzden null guvenli.
class ReleaseNoteServiceTest {

    private final ReleaseNoteService releaseNoteService = new ReleaseNoteService(null, null, null);

    @Test
    void scriptTagIcerenMetin_temizlenir() {
        String withScript = "Merhaba <script>alert('xss')</script> Dunya";

        String result = releaseNoteService.sanitize(withScript);

        assertThat(result).doesNotContain("<script>");
        assertThat(result).doesNotContain("alert");
        assertThat(result).contains("Merhaba").contains("Dunya");
    }

    @Test
    void htmlIcermeyenDuzMetin_degismedenKalir() {
        String plainText = "Sadece duz metin, hicbir HTML yok.";

        String result = releaseNoteService.sanitize(plainText);

        assertThat(result).isEqualTo(plainText);
    }

    @Test
    void markdownSatirYapisi_korunur() {
        // Bos satirlar ve satir sonlari - sanitize() ustundeki yoruma gore
        // prettyPrint(false) bu yapiyi tek boslukta toplamamali.
        String markdown = "# Baslik\n\n- madde 1\n- madde 2\n\nParagraf metni.";

        String result = releaseNoteService.sanitize(markdown);

        assertThat(result).isEqualTo(markdown);
    }
}
