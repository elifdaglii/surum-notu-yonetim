package com.surumnotu.backend.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

import org.jsoup.Jsoup;
import org.springframework.stereotype.Service;

import com.openhtmltopdf.outputdevice.helper.BaseRendererBuilder.FontStyle;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;

import com.surumnotu.backend.dto.ReleaseNoteResponse;

/**
 * Sürüm notunu (versiyon, tarih, kategori, markdown içerik) PDF'e dönüştürür.
 * Markdown->HTML render ve ortak marka CSS'i ReleaseNoteDocumentRenderer'dan geliyor
 * (bkz. SNYS-28 HTML export ile paylaşılıyor); burada sadece PDF'e özgü kısımlar var:
 * @page kuralı ve fontların openhtmltopdf'e Java tarafından programatik olarak
 * gömülmesi (PDFBox tabanlı) - bu sayede başlık/kalın/madde listesi biçimlendirmesi
 * düz metne dökülmeden korunur.
 */
@Service
public class PdfExportService {

    private final ReleaseNoteDocumentRenderer documentRenderer;

    public PdfExportService(ReleaseNoteDocumentRenderer documentRenderer) {
        this.documentRenderer = documentRenderer;
    }

    public byte[] generate(ReleaseNoteResponse note) {
        String contentHtml = documentRenderer.renderContentHtml(note.contentMarkdown());
        String fullHtml = buildHtml(note, contentHtml);

        org.jsoup.nodes.Document jsoupDoc = Jsoup.parse(fullHtml);
        org.w3c.dom.Document w3cDoc = new org.jsoup.helper.W3CDom().fromJsoup(jsoupDoc);

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

    public String fileName(ReleaseNoteResponse note) {
        return documentRenderer.fileNameStem(note) + ".pdf";
    }

    private InputStream fontStream(String fileName) {
        InputStream stream = getClass().getResourceAsStream("/fonts/" + fileName);
        if (stream == null) {
            throw new IllegalStateException("Font kaynagi bulunamadi: " + fileName);
        }
        return stream;
    }

    private String buildHtml(ReleaseNoteResponse note, String contentHtml) {
        String css = "@page { size: A4; margin: 2.2cm 2cm; }" + documentRenderer.sharedCss();

        return "<html><head><style>" + css + "</style></head><body>"
                + documentRenderer.renderBodyHtml(note, contentHtml)
                + "</body></html>";
    }
}
