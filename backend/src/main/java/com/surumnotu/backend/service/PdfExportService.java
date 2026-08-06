package com.surumnotu.backend.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import org.commonmark.node.Node;
import org.commonmark.parser.Parser;
import org.commonmark.renderer.html.HtmlRenderer;
import org.jsoup.Jsoup;
import org.jsoup.helper.W3CDom;
import org.springframework.stereotype.Service;

import com.openhtmltopdf.outputdevice.helper.BaseRendererBuilder.FontStyle;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;

import com.surumnotu.backend.dto.ReleaseNoteResponse;

/**
 * Sürüm notunu (versiyon, tarih, kategori, markdown içerik) PDF'e dönüştürür.
 * Markdown önce commonmark ile HTML'e render edilir, ardından sabit bir HTML/CSS
 * şablonuna gömülüp openhtmltopdf (PDFBox tabanlı) ile PDF'e basılır - bu sayede
 * başlık/kalın/madde listesi biçimlendirmesi düz metne dökülmeden korunur.
 */
@Service
public class PdfExportService {

    // Kod tabanının mor marka rengi (bkz. frontend tailwind primary token) - PDF'te
    // sadece başlık ve kategori etiketinde vurgu olarak kullanılıyor, gövde açık/beyaz.
    private static final String BRAND_PURPLE = "#7c3aed";

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("d MMMM yyyy", new Locale("tr", "TR"));

    private final Parser markdownParser = Parser.builder().build();
    private final HtmlRenderer htmlRenderer = HtmlRenderer.builder().build();

    public byte[] generate(ReleaseNoteResponse note) {
        Node document = markdownParser.parse(note.contentMarkdown() == null ? "" : note.contentMarkdown());
        String contentHtml = htmlRenderer.render(document);

        String fullHtml = buildHtml(note, contentHtml);
        org.jsoup.nodes.Document jsoupDoc = Jsoup.parse(fullHtml);
        org.w3c.dom.Document w3cDoc = new W3CDom().fromJsoup(jsoupDoc);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withW3cDocument(w3cDoc, "");
            builder.useFont(() -> fontStream("NotoSans-Regular.ttf"), "Noto Sans", 400, FontStyle.NORMAL, true);
            builder.useFont(() -> fontStream("NotoSans-Bold.ttf"), "Noto Sans", 700, FontStyle.NORMAL, true);
            builder.toStream(out);
            builder.run();
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("PDF olusturulamadi", e);
        }
    }

    /** Dosya adı için: "surum-notu-v1.2.0.pdf" (version zaten "v" öneki içeriyor, bkz. VERSION_PATTERN). */
    public String fileName(ReleaseNoteResponse note) {
        String safeVersion = note.version().replaceAll("[^a-zA-Z0-9._-]", "");
        return "surum-notu-" + safeVersion + ".pdf";
    }

    private InputStream fontStream(String fileName) {
        InputStream stream = getClass().getResourceAsStream("/fonts/" + fileName);
        if (stream == null) {
            throw new IllegalStateException("Font kaynagi bulunamadi: " + fileName);
        }
        return stream;
    }

    private String buildHtml(ReleaseNoteResponse note, String contentHtml) {
        String categoryBadge = note.category() != null
                ? "<span class=\"category-badge\">" + escapeHtml(note.category().name()) + "</span>"
                : "";

        return "<html><head><style>" + css() + "</style></head><body>"
                + "<div class=\"header\">"
                + "<p class=\"version\">" + escapeHtml(note.version()) + "</p>"
                + "<p class=\"meta\">" + note.releaseDate().format(DATE_FORMATTER) + "</p>"
                + categoryBadge
                + "</div>"
                + "<div class=\"content\">" + contentHtml + "</div>"
                + "</body></html>";
    }

    private String css() {
        return "@page { size: A4; margin: 2.2cm 2cm; }"
                + "* { font-family: 'Noto Sans', sans-serif; }"
                + "body { color: #1f2430; background-color: #ffffff; font-size: 11pt; line-height: 1.5; margin: 0; }"
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

    private String escapeHtml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
