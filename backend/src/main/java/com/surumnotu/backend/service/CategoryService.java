package com.surumnotu.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.surumnotu.backend.dto.CategoryRequest;
import com.surumnotu.backend.dto.CategoryResponse;
import com.surumnotu.backend.entity.Category;
import com.surumnotu.backend.repository.CategoryRepository;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
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

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(category.getId(), category.getName());
    }
}
