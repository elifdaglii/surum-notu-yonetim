package com.surumnotu.backend.service;

import java.util.List;

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

        Category category = null;
        if (request.categoryId() != null) {
            category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Kategori bulunamadi: " + request.categoryId()));
        }

        ReleaseNote note = ReleaseNote.builder()
                .version(request.version())
                .releaseDate(request.releaseDate())
                .contentMarkdown(request.contentMarkdown())
                .category(category)
                .createdBy(creator)
                .build();

        return toResponse(releaseNoteRepository.save(note));
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
