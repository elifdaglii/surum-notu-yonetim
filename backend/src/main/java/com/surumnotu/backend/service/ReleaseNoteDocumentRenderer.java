package com.surumnotu.backend.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Locale;

import org.commonmark.node.Node;
import org.commonmark.parser.Parser;
import org.commonmark.renderer.html.HtmlRenderer;
import org.springframework.stereotype.Component;

import com.surumnotu.backend.dto.ReleaseNoteResponse;

/**
 * PDF (SNYS-27a) ve HTML (SNYS-28) dışa aktarmalarının paylaştığı kısım: markdown'ı
 * commonmark ile HTML'e render etme, ortak marka başlığı (onbiron logosu + versiyon +
 * tarih + kategori etiketi) ve ortak CSS kuralları. İki servis de aynı sade/nötr görsel
 * kimliği (gri tonlar, tek renk vurgu logo dışında yok) burada tek yerden alıyor -
 * tekrar yazılmıyor.
 */
@Component
public class ReleaseNoteDocumentRenderer {

    // Koyu nötr metin/rozet tonu - eski marka kırmızısının yerini aldı, tüm vurgular
    // (versiyon, kategori rozeti, başlıklar) artık bu tek nötr renk üzerinden.
    static final String INK = "#1f2430";
    // İnce kart/ayırıcı çizgi border rengi.
    static final String BORDER_GRAY = "#dcdfe4";
    // Tarih gibi ikincil metinler için soluk gri.
    static final String MUTED_GRAY = "#6b7280";
    // Footer (sayfa no. + telif) için daha da soluk gri.
    static final String FOOTER_GRAY = "#9aa0a8";

    /** Footer'da sağda gösterilen telif metni - PDF (@page margin box) ve HTML
     *  (sabit alt bar) aynı metni farklı mekanizmalarla basıyor, bkz. PdfExportService /
     *  HtmlExportService. */
    public static final String FOOTER_COPYRIGHT = "© 2026 Onbiron. Tüm hakları saklıdır.";

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("d MMMM yyyy", new Locale("tr", "TR"));

    private final Parser markdownParser = Parser.builder().build();
    private final HtmlRenderer htmlRenderer = HtmlRenderer.builder().build();

    // Açık zeminde kullanılacak "onbiron" logosu (branding/logo_light.png) - base64 data
    // URI olarak <img>'e gömülüyor, hem PDF (openhtmltopdf data URI'yi doğrudan render
    // edebiliyor) hem HTML export'ta (dışarıdaki dosyaya bağımlı olmadan) aynı şekilde
    // çalışıyor. Tek seferlik okuma, her iki servis de aynı örneği paylaşıyor (@Component).
    private final String logoDataUri = "data:image/png;base64," + readResourceAsBase64("/branding/logo_light.png");

    public String renderContentHtml(String markdown) {
        Node document = markdownParser.parse(markdown == null ? "" : markdown);
        return htmlRenderer.render(document);
    }

    /** Üst satır: solda logo, sağda kategori rozeti - kategoriye göre renk değişmiyor,
     *  hepsi aynı nötr koyu ton (bkz. sharedCss .category-badge). */
    private String renderHeaderHtml(ReleaseNoteResponse note) {
        String categoryBadge = note.category() != null
                ? "<span class=\"category-badge\">" + escapeHtml(note.category().name()) + "</span>"
                : "";

        return "<div class=\"header-row\">"
                + "<div class=\"brand\"><img src=\"" + logoDataUri + "\" alt=\"onbiron\" /></div>"
                + categoryBadge
                + "</div>"
                + "<div class=\"title-block\">"
                + "<p class=\"version\">" + escapeHtml(note.version()) + "</p>"
                + "<p class=\"meta\">Yayınlanma Tarihi: " + note.releaseDate().format(DATE_FORMATTER) + "</p>"
                + "</div>";
    }

    /** Sadece HTML export için sabit alt bar - PDF'te aynı bilgi gerçek sayfa
     *  numarasıyla @page margin box'tan geliyor (bkz. PdfExportService), tek sayfalık
     *  HTML dosyasında "Sayfa 1 / 1" sabit metin olarak yeterli. */
    public String renderFooterHtml() {
        return "<div class=\"footer-bar\"><span>Sayfa 1 / 1</span><span>"
                + escapeHtml(FOOTER_COPYRIGHT) + "</span></div>";
    }

    private static String readResourceAsBase64(String resourcePath) {
        try (InputStream stream = ReleaseNoteDocumentRenderer.class.getResourceAsStream(resourcePath)) {
            if (stream == null) {
                throw new IllegalStateException("Kaynak bulunamadi: " + resourcePath);
            }
            return Base64.getEncoder().encodeToString(stream.readAllBytes());
        } catch (IOException e) {
            throw new UncheckedIOException("Kaynak okunamadi: " + resourcePath, e);
        }
    }

    /** Tüm içerik ince tek bir border'la çevrili "card" kabında (bkz. sharedCss .card),
     *  bu kap da okunabilir bir genişliğe sınırlanmış "page" içinde ortalanıyor - sayfa
     *  kenarlarından biraz boşluklu duruyor. */
    public String renderBodyHtml(ReleaseNoteResponse note, String contentHtml) {
        return "<div class=\"page\">"
                + "<div class=\"card\">"
                + renderHeaderHtml(note)
                + "<hr class=\"divider\" />"
                + "<h2 class=\"section-title\">Bu Sürümde Neler Var</h2>"
                + "<div class=\"content\">" + contentHtml + "</div>"
                + "</div>"
                + "</div>";
    }

    /** İki dışa aktarma biçiminin de kullandığı ortak kurallar - font kaynağı (embed
     *  mekanizması) ve sayfa/print ayarları her servisin kendi CSS'ine kalıyor. */
    public String sharedCss() {
        return "* { font-family: 'Noto Sans', sans-serif; box-sizing: border-box; }"
                + "body { color: " + INK + "; background-color: #ffffff; font-size: 11pt; line-height: 1.5; margin: 0; }"
                // Okunabilir bir genişliğe sınırlayıp ortalıyor - PDF'te @page zaten kenar
                // boşluğu veriyor (bkz. PdfExportService), bu yalnızca içeriği geniş
                // A4 sayfasında ortalıyor; HTML'de asıl boşluğu HtmlExportService'in
                // eklediği ek padding kuralı sağlıyor (tarayıcıda @page karşılığı yok).
                + ".page { max-width: 800px; margin: 0 auto; }"
                // Tüm içeriği çevreleyen ince tek border'lı kart - referans tasarımdaki
                // "card" görünümü, sayfa/pencere kenarına doğrudan yapışmıyor.
                + ".card { border: 1pt solid " + BORDER_GRAY + "; border-radius: 6pt; padding: 26pt 30pt; }"
                // openhtmltopdf flexbox'ı desteklemediği için (bkz. PdfExportService
                // testinde alınan "Value flex is not a recognized identifier" uyarısı)
                // sağ/sol hizalama float + clear ile yapılıyor - hem PDF hem tarayıcıda
                // aynı sonucu veriyor.
                + ".brand { float: left; }"
                + ".brand img { display: block; height: 20pt; width: auto; }"
                // Kategori rozeti artık kategoriye göre renk değişmeyen, dolu koyu nötr
                // zeminli tek tip pill - eskiden kategoriye göre renklenen/kırmızı outline
                // stildi.
                + ".category-badge { float: right; display: inline-block; padding: 4pt 11pt; border-radius: 10pt;"
                + " background-color: " + INK + "; color: #ffffff;"
                + " font-size: 8pt; font-weight: 700; letter-spacing: 0.3pt; }"
                + ".title-block { clear: both; margin-top: 16pt; }"
                // Versiyon en belirgin metin kalmaya devam ediyor ama artık sayfayı domine
                // etmiyor - eski 22pt'in yaklaşık üçte ikisine küçültüldü.
                + ".version { font-size: 15pt; font-weight: 700; color: " + INK + "; margin: 0; }"
                + ".meta { font-size: 9pt; color: " + MUTED_GRAY + "; margin: 4pt 0 0 0; }"
                + ".divider { border: none; border-top: 1pt solid " + BORDER_GRAY + "; margin: 18pt 0 16pt 0; }"
                + ".section-title { font-size: 12pt; font-weight: 700; color: " + INK + "; margin: 0 0 10pt 0; }"
                + ".content h1, .content h2, .content h3 { color: " + INK + "; font-weight: 700; margin: 14pt 0 6pt 0; }"
                + ".content h1 { font-size: 14pt; }"
                + ".content h2 { font-size: 12.5pt; }"
                + ".content h3 { font-size: 11pt; }"
                + ".content p { margin: 0 0 8pt 0; }"
                + ".content strong { font-weight: 700; }"
                + ".content em { font-style: italic; }"
                + ".content ul, .content ol { margin: 0 0 8pt 0; padding-left: 18pt; }"
                + ".content li { margin-bottom: 3pt; }"
                // Madde işaretleri de nötr koyu tonda - kırmızı/mor vurgu yok.
                + ".content li::marker { color: " + INK + "; }"
                + ".content code { font-family: monospace; background-color: #f1f1f4; padding: 1pt 3pt; border-radius: 3pt; }"
                // Sadece HTML export'ta kullanılan sabit alt bar (bkz. renderFooterHtml) -
                // PDF'te bu bilginin karşılığı @page margin box ile geliyor. Sol/sağ
                // hizalama burada da float ile (bkz. .brand/.category-badge notu) -
                // openhtmltopdf bu CSS'i (kullanılmasa da) parse ettiği için flex yerine
                // her iki motorda da çalışan aynı teknik tercih edildi.
                + ".footer-bar { position: fixed; left: 0; right: 0; bottom: 0; background-color: #ffffff;"
                + " border-top: 1pt solid " + BORDER_GRAY + "; padding: 10pt 40px;"
                + " font-size: 8pt; color: " + FOOTER_GRAY + "; }"
                + ".footer-bar span:first-child { float: left; }"
                + ".footer-bar span:last-child { float: right; }";
    }

    /** "surum-notu-v1.2.0" (uzantısız) - version zaten "v" öneki içeriyor, bkz. VERSION_PATTERN. */
    public String fileNameStem(ReleaseNoteResponse note) {
        return "surum-notu-" + note.version().replaceAll("[^a-zA-Z0-9._-]", "");
    }

    public String escapeHtml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
