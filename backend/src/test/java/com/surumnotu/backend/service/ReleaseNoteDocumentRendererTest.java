package com.surumnotu.backend.service;

import com.surumnotu.backend.dto.ReleaseNoteResponse;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class ReleaseNoteDocumentRendererTest {

    @Test
    void renderBodyHtml_doesNotDuplicateUserProvidedHeading() {
        ReleaseNoteDocumentRenderer renderer = new ReleaseNoteDocumentRenderer();
        String markdown = "## Bu Sürümde Neler Var\n\n- Yeni özellik eklendi\n- Hata düzeltildi";
        String contentHtml = renderer.renderContentHtml(markdown);

        ReleaseNoteResponse note = new ReleaseNoteResponse(
                1L,
                "v1.0.0",
                LocalDate.of(2026, 8, 14),
                markdown,
                null,
                "tester",
                null
        );

        String body = renderer.renderBodyHtml(note, contentHtml);

        int occurrences = body.split("Bu Sürümde Neler Var", -1).length - 1;
        assertThat(occurrences).isEqualTo(1);
    }
}
