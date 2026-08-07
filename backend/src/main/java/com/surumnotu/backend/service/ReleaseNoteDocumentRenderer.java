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
 * tarih + kategori etiketi) ve ortak CSS kuralları. İki servis de aynı görsel kimliği
 * (kırmızı vurgu #e0473d, açık/beyaz zemin) burada tek yerden alıyor - tekrar yazılmıyor.
 */
@Component
public class ReleaseNoteDocumentRenderer {

    // Logodan (branding/logo.png) piksel olarak örneklenen ton - marka kırmızısı.
    static final String BRAND_RED = "#e0473d";

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

    private String renderHeaderHtml(ReleaseNoteResponse note) {
        String categoryBadge = note.category() != null
                ? "<span class=\"category-badge\">" + escapeHtml(note.category().name()) + "</span>"
                : "";

        return "<div class=\"brand\"><img src=\"" + logoDataUri + "\" alt=\"onbiron\" /></div>"
                + "<div class=\"header\">"
                + "<p class=\"version\">" + escapeHtml(note.version()) + "</p>"
                + "<p class=\"meta\">" + note.releaseDate().format(DATE_FORMATTER) + "</p>"
                + categoryBadge
                + "</div>";
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

    /** Marka başlığı + içerik, okunabilir bir genişliğe sınırlanmış ve ortalanmış tek bir
     *  "page" kabında (bkz. sharedCss .page) - logo/başlık de dahil hiçbir şey doğrudan
     *  sayfa/pencere kenarına yapışmıyor. */
    public String renderBodyHtml(ReleaseNoteResponse note, String contentHtml) {
        return "<div class=\"page\">"
                + renderHeaderHtml(note)
                + "<div class=\"content\">" + contentHtml + "</div>"
                + "</div>";
    }

    /** İki dışa aktarma biçiminin de kullandığı ortak kurallar - font kaynağı (embed
     *  mekanizması) ve sayfa/print ayarları her servisin kendi CSS'ine kalıyor. */
    public String sharedCss() {
        return "* { font-family: 'Noto Sans', sans-serif; box-sizing: border-box; }"
                + "body { color: #1f2430; background-color: #ffffff; font-size: 11pt; line-height: 1.5; margin: 0; }"
                // Okunabilir bir genişliğe sınırlayıp ortalıyor - PDF'te @page zaten kenar
                // boşluğu veriyor (bkz. PdfExportService), bu yalnızca içeriği geniş
                // A4 sayfasında ortalıyor; HTML'de asıl boşluğu HtmlExportService'in
                // eklediği ek padding kuralı sağlıyor (tarayıcıda @page karşılığı yok).
                + ".page { max-width: 800px; margin: 0 auto; }"
                // Sol üstte marka logosu (onbiron, açık zemin varyantı) - eskiden burada
                // metinsel bir "SNYS" rozeti vardı, konum/boşluk mantığı (üstte, header'dan
                // önce, 10pt alt boşluk) aynı kalıyor, sadece rozet yerine gerçek logo geldi.
                + ".brand { margin-bottom: 10pt; }"
                + ".brand img { display: block; height: 24pt; width: auto; }"
                + ".header { margin-bottom: 18pt; border-bottom: 1.5pt solid " + BRAND_RED + "; padding-bottom: 10pt; }"
                + ".version { font-size: 22pt; font-weight: 700; color: " + BRAND_RED + "; margin: 0; }"
                + ".meta { font-size: 10pt; color: #555555; margin: 4pt 0 0 0; }"
                // Kategori badge'i artik outline stil: kirmizi border + kirmizi metin,
                // dolu kirmizi zemin degil (genel zemin acik/beyaz kaliyor).
                + ".category-badge { display: inline-block; margin-top: 8pt; padding: 3pt 10pt; border-radius: 10pt;"
                + " border: 1pt solid " + BRAND_RED + "; color: " + BRAND_RED + "; background-color: #ffffff;"
                + " font-size: 9pt; font-weight: 700; }"
                + ".content h1, .content h2, .content h3 { color: #1f2430; font-weight: 700; margin: 14pt 0 6pt 0; }"
                + ".content h1 { font-size: 16pt; }"
                + ".content h2 { font-size: 14pt; }"
                + ".content h3 { font-size: 12pt; }"
                + ".content p { margin: 0 0 8pt 0; }"
                + ".content strong { font-weight: 700; }"
                + ".content em { font-style: italic; }"
                + ".content ul, .content ol { margin: 0 0 8pt 0; padding-left: 18pt; }"
                + ".content li { margin-bottom: 3pt; }"
                + ".content code { font-family: monospace; background-color: #f1f1f4; padding: 1pt 3pt; border-radius: 3pt; }";
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
