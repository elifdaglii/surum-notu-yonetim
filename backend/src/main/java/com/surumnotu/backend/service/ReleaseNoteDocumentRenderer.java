package com.surumnotu.backend.service;

import java.time.format.DateTimeFormatter;
import java.util.Locale;

import org.commonmark.node.Node;
import org.commonmark.parser.Parser;
import org.commonmark.renderer.html.HtmlRenderer;
import org.springframework.stereotype.Component;

import com.surumnotu.backend.dto.ReleaseNoteResponse;

/**
 * PDF (SNYS-27a) ve HTML (SNYS-28) dışa aktarmalarının paylaştığı kısım: markdown'ı
 * commonmark ile HTML'e render etme, ortak marka başlığı (SNYS logosu + versiyon +
 * tarih + kategori etiketi) ve ortak CSS kuralları. İki servis de aynı görsel kimliği
 * (mor vurgu #7c3aed, açık/beyaz zemin) burada tek yerden alıyor - tekrar yazılmıyor.
 */
@Component
public class ReleaseNoteDocumentRenderer {

    static final String BRAND_PURPLE = "#7c3aed";

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("d MMMM yyyy", new Locale("tr", "TR"));

    private final Parser markdownParser = Parser.builder().build();
    private final HtmlRenderer htmlRenderer = HtmlRenderer.builder().build();

    public String renderContentHtml(String markdown) {
        Node document = markdownParser.parse(markdown == null ? "" : markdown);
        return htmlRenderer.render(document);
    }

    private String renderHeaderHtml(ReleaseNoteResponse note) {
        String categoryBadge = note.category() != null
                ? "<span class=\"category-badge\">" + escapeHtml(note.category().name()) + "</span>"
                : "";

        return "<div class=\"brand\"><span>SNYS</span></div>"
                + "<div class=\"header\">"
                + "<p class=\"version\">" + escapeHtml(note.version()) + "</p>"
                + "<p class=\"meta\">" + note.releaseDate().format(DATE_FORMATTER) + "</p>"
                + categoryBadge
                + "</div>";
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
                // openhtmltopdf flexbox/inline-SVG desteklemiyor (bkz. PDF export), bu yüzden
                // marka rozeti kategori etiketiyle aynı, basit inline-block + arka plan
                // renginde bir metin rozeti - hem PDF hem tarayıcıda aynı görünüyor.
                + ".brand { margin-bottom: 10pt; }"
                + ".brand span { display: inline-block; background-color: " + BRAND_PURPLE + "; color: #ffffff;"
                + " font-weight: 700; font-size: 9pt; letter-spacing: 0.5pt; padding: 3pt 8pt; border-radius: 4pt; }"
                + ".header { margin-bottom: 18pt; border-bottom: 2pt solid " + BRAND_PURPLE + "; padding-bottom: 10pt; }"
                + ".version { font-size: 22pt; font-weight: 700; color: " + BRAND_PURPLE + "; margin: 0; }"
                + ".meta { font-size: 10pt; color: #555555; margin: 4pt 0 0 0; }"
                + ".category-badge { display: inline-block; margin-top: 8pt; padding: 3pt 10pt; border-radius: 10pt;"
                + " background-color: " + BRAND_PURPLE + "; color: #ffffff; font-size: 9pt; font-weight: 700; }"
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
