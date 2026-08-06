package com.surumnotu.backend.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import org.springframework.stereotype.Service;

import com.surumnotu.backend.dto.ReleaseNoteResponse;

/**
 * Sürüm notunu tek başına açılabilen bir .html dosyasına dönüştürür (SNYS-28).
 * Markdown->HTML render ve ortak marka CSS'i ReleaseNoteDocumentRenderer'dan geliyor
 * (PDF export ile paylaşılıyor, bkz. SNYS-27a). PDF'ten farkı: font harici bir
 * dosyaya/CDN'e bağlı olamayacağı için Noto Sans TTF'leri base64 data URI olarak
 * @font-face ile CSS'in içine gömülüyor - dosya internet bağlantısı olmadan da,
 * herhangi bir yerde tek başına açılınca aynı görünmeli.
 */
@Service
public class HtmlExportService {

    private final ReleaseNoteDocumentRenderer documentRenderer;
    private final String regularFontBase64;
    private final String boldFontBase64;

    public HtmlExportService(ReleaseNoteDocumentRenderer documentRenderer) {
        this.documentRenderer = documentRenderer;
        this.regularFontBase64 = readFontAsBase64("NotoSans-Regular.ttf");
        this.boldFontBase64 = readFontAsBase64("NotoSans-Bold.ttf");
    }

    public byte[] generate(ReleaseNoteResponse note) {
        String contentHtml = documentRenderer.renderContentHtml(note.contentMarkdown());
        String css = fontFaceCss() + documentRenderer.sharedCss();

        String html = "<!doctype html><html lang=\"tr\"><head><meta charset=\"utf-8\">"
                + "<title>" + documentRenderer.escapeHtml(note.version()) + " - Sürüm Notu</title>"
                + "<style>" + css + "</style></head><body>"
                + documentRenderer.renderHeaderHtml(note)
                + "<div class=\"content\">" + contentHtml + "</div>"
                + "</body></html>";

        return html.getBytes(StandardCharsets.UTF_8);
    }

    public String fileName(ReleaseNoteResponse note) {
        return documentRenderer.fileNameStem(note) + ".html";
    }

    private String fontFaceCss() {
        return "@font-face { font-family: 'Noto Sans'; font-weight: 400; font-style: normal;"
                + " src: url(data:font/ttf;base64," + regularFontBase64 + ") format('truetype'); }"
                + "@font-face { font-family: 'Noto Sans'; font-weight: 700; font-style: normal;"
                + " src: url(data:font/ttf;base64," + boldFontBase64 + ") format('truetype'); }";
    }

    private String readFontAsBase64(String fileName) {
        try (InputStream stream = getClass().getResourceAsStream("/fonts/" + fileName)) {
            if (stream == null) {
                throw new IllegalStateException("Font kaynagi bulunamadi: " + fileName);
            }
            return Base64.getEncoder().encodeToString(stream.readAllBytes());
        } catch (IOException e) {
            throw new UncheckedIOException("Font okunamadi: " + fileName, e);
        }
    }
}
