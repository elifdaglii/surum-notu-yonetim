package com.surumnotu.backend.service;

import java.util.List;

import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Service;

import com.surumnotu.backend.dto.CategoryResponse;
import com.surumnotu.backend.dto.ReleaseNoteRequest;
import com.surumnotu.backend.dto.ReleaseNoteResponse;
import com.surumnotu.backend.entity.Category;
import com.surumnotu.backend.entity.ReleaseNote;
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

    public List<ReleaseNoteResponse> getAll(Long categoryId) {
        List<ReleaseNote> notes = categoryId != null
                ? releaseNoteRepository.findByCategory_IdOrderByReleaseDateDesc(categoryId)
                : releaseNoteRepository.findAllByOrderByReleaseDateDesc();

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

    public ReleaseNoteResponse update(Long id, ReleaseNoteRequest request) {
        ReleaseNote note = releaseNoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Surum notu bulunamadi: " + id));

        note.setVersion(request.version());
        note.setReleaseDate(request.releaseDate());
        note.setContentMarkdown(sanitize(request.contentMarkdown()));
        note.setCategory(resolveCategory(request.categoryId()));

        return toResponse(releaseNoteRepository.save(note));
    }

    public void delete(Long id) {
        if (!releaseNoteRepository.existsById(id)) {
            throw new ResourceNotFoundException("Surum notu bulunamadi: " + id);
        }
        releaseNoteRepository.deleteById(id);
    }

    private Category resolveCategory(Long categoryId) {
        if (categoryId == null) {
            return null;
        }
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Kategori bulunamadi: " + categoryId));
    }

    private String sanitize(String rawContent) {
        return Jsoup.clean(rawContent, Safelist.none());
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
