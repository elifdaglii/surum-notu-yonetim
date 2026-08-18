package com.surumnotu.backend.service;

import java.util.List;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.safety.Safelist;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.surumnotu.backend.dto.CategoryResponse;
import com.surumnotu.backend.dto.ReleaseNoteRequest;
import com.surumnotu.backend.dto.ReleaseNoteResponse;
import com.surumnotu.backend.entity.Category;
import com.surumnotu.backend.entity.ReleaseNote;
import com.surumnotu.backend.entity.Role;
import com.surumnotu.backend.entity.User;
import com.surumnotu.backend.repository.CategoryRepository;
import com.surumnotu.backend.repository.ReleaseNoteRepository;
import com.surumnotu.backend.repository.UserRepository;

@Service
public class ReleaseNoteService {

    private final ReleaseNoteRepository releaseNoteRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public ReleaseNoteService(ReleaseNoteRepository releaseNoteRepository,
                               CategoryRepository categoryRepository,
                               UserRepository userRepository) {
        this.releaseNoteRepository = releaseNoteRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    public List<ReleaseNoteResponse> getAll(Long categoryId, String createdByUsername) {
        List<ReleaseNote> notes;
        if (categoryId != null && createdByUsername != null) {
            notes = releaseNoteRepository.findByCategory_IdAndCreatedBy_UsernameOrderByReleaseDateDesc(categoryId, createdByUsername);
        } else if (categoryId != null) {
            notes = releaseNoteRepository.findByCategory_IdOrderByReleaseDateDesc(categoryId);
        } else if (createdByUsername != null) {
            notes = releaseNoteRepository.findByCreatedBy_UsernameOrderByReleaseDateDesc(createdByUsername);
        } else {
            notes = releaseNoteRepository.findAllByOrderByReleaseDateDesc();
        }

        return notes.stream().map(this::toResponse).toList();
    }

    public ReleaseNoteResponse getById(Long id) {
        ReleaseNote note = releaseNoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Surum notu bulunamadi: " + id));

        return toResponse(note);
    }

    public List<ReleaseNoteResponse> search(String query) {
        return releaseNoteRepository.search(query).stream()
                .map(this::toResponse)
                .toList();
    }

    public ReleaseNoteResponse create(ReleaseNoteRequest request, String currentUsername) {
        User creator = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Giris yapan kullanici bulunamadi: " + currentUsername));

        ReleaseNote note = ReleaseNote.builder()
                .version(request.version())
                .releaseDate(request.releaseDate())
                .contentMarkdown(sanitize(request.contentMarkdown()))
                .category(resolveCategory(request.categoryId()))
                .createdBy(creator)
                .build();

        return toResponse(releaseNoteRepository.save(note));
    }

    public ReleaseNoteResponse update(Long id, ReleaseNoteRequest request, String currentUsername) {
        ReleaseNote note = releaseNoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Surum notu bulunamadi: " + id));

        assertCanManage(note, currentUsername);

        note.setVersion(request.version());
        note.setReleaseDate(request.releaseDate());
        note.setContentMarkdown(sanitize(request.contentMarkdown()));
        note.setCategory(resolveCategory(request.categoryId()));

        return toResponse(releaseNoteRepository.save(note));
    }

    public void delete(Long id, String currentUsername) {
        ReleaseNote note = releaseNoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Surum notu bulunamadi: " + id));

        assertCanManage(note, currentUsername);

        releaseNoteRepository.delete(note);
    }

    // ADMIN her zaman izinli; USER sadece notu kendisi olusturduysa (createdBy kendi
    // kullanicisiyla eslesiyorsa) izinli. Eslesmezse (ya da createdBy null ise - sahibi
    // belirsiz eski kayitlar) 403 donuyor.
    private void assertCanManage(ReleaseNote note, String currentUsername) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Giris yapan kullanici bulunamadi: " + currentUsername));

        if (currentUser.getRole() == Role.ADMIN) {
            return;
        }

        boolean isOwner = note.getCreatedBy() != null
                && note.getCreatedBy().getId().equals(currentUser.getId());

        if (!isOwner) {
            throw new AccessDeniedException("Bu surum notunu duzenleme/silme yetkiniz yok");
        }
    }

    private Category resolveCategory(Long categoryId) {
        if (categoryId == null) {
            return null;
        }
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Kategori bulunamadi: " + categoryId));
    }

    // contentMarkdown markdown kaynagi, HTML degil - Jsoup.clean(rawContent, Safelist.none())
    // varsayilan ayarlarla cagrilirsa girdiyi HTML olarak parse/serialize ederken bos
    // satirlari/satir sonlarini tek boslugta topluyor, bu da markdown'un blok yapisini
    // (basliklar, madde listeleri) bozuyor. prettyPrint(false) ile whitespace/satir
    // sonlari oldugu gibi korunuyor, HTML tag'leri (Safelist.none()) yine de temizleniyor.
    String sanitize(String rawContent) {
        Document.OutputSettings outputSettings = new Document.OutputSettings().prettyPrint(false);
        return Jsoup.clean(rawContent, "", Safelist.none(), outputSettings);
    }

    private ReleaseNoteResponse toResponse(ReleaseNote note) {
        CategoryResponse categoryResponse = note.getCategory() != null
                ? new CategoryResponse(note.getCategory().getId(), note.getCategory().getName())
                : null;

        String createdByUsername = note.getCreatedBy() != null
                ? note.getCreatedBy().getUsername()
                : null;

        return new ReleaseNoteResponse(
                note.getId(),
                note.getVersion(),
                note.getReleaseDate(),
                note.getContentMarkdown(),
                categoryResponse,
                createdByUsername,
                note.getCreatedAt()
        );
    }
}
