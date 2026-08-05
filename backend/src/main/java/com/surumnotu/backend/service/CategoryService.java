package com.surumnotu.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.surumnotu.backend.dto.CategoryRequest;
import com.surumnotu.backend.dto.CategoryResponse;
import com.surumnotu.backend.entity.Category;
import com.surumnotu.backend.repository.CategoryRepository;
import com.surumnotu.backend.repository.ReleaseNoteRepository;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ReleaseNoteRepository releaseNoteRepository;

    public CategoryService(CategoryRepository categoryRepository, ReleaseNoteRepository releaseNoteRepository) {
        this.categoryRepository = categoryRepository;
        this.releaseNoteRepository = releaseNoteRepository;
    }

    public List<CategoryResponse> getAll() {
        return categoryRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public CategoryResponse create(CategoryRequest request) {
        Category category = Category.builder()
                .name(request.name())
                .build();

        return toResponse(categoryRepository.save(category));
    }

    // Kategoriye bağlı sürüm notu varsa silme reddediliyor - notlar sahipsiz (category=null)
    // kalıp arşivde "kategorisiz" görünmesin, veri kaybı da olmasın diye. Admin önce o
    // notları başka bir kategoriye taşımalı ya da silmeli.
    public void delete(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kategori bulunamadi: " + id));

        long linkedNoteCount = releaseNoteRepository.countByCategory_Id(id);
        if (linkedNoteCount > 0) {
            throw new CategoryInUseException(
                    "Bu kategoriye bagli " + linkedNoteCount + " surum notu var, once onlari baska bir kategoriye tasiyin veya silin");
        }

        categoryRepository.delete(category);
    }

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(category.getId(), category.getName());
    }
}
