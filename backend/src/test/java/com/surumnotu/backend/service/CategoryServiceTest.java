package com.surumnotu.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.surumnotu.backend.entity.Category;
import com.surumnotu.backend.repository.CategoryRepository;
import com.surumnotu.backend.repository.ReleaseNoteRepository;

// Repository'ler tamamen mock - gercek veritabanina gidilmiyor, test hizli ve
// izole (bkz. CategoryService.delete).
@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ReleaseNoteRepository releaseNoteRepository;

    @InjectMocks
    private CategoryService categoryService;

    @Test
    void kategoriHicbirNotta_kullanilmiyorsa_silinebilir() {
        Long categoryId = 1L;
        Category category = Category.builder().id(categoryId).name("Bugfix").build();

        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
        when(releaseNoteRepository.countByCategory_Id(categoryId)).thenReturn(0L);

        categoryService.delete(categoryId);

        verify(categoryRepository, times(1)).delete(category);
    }

    @Test
    void kategoriEnAzBirNotta_kullaniliyorsa_silmeReddedilir() {
        Long categoryId = 2L;
        Category category = Category.builder().id(categoryId).name("Feature").build();

        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
        when(releaseNoteRepository.countByCategory_Id(categoryId)).thenReturn(3L);

        assertThatThrownBy(() -> categoryService.delete(categoryId))
                .isInstanceOf(CategoryInUseException.class)
                .hasMessageContaining("3 surum notu");

        verify(categoryRepository, never()).delete(any());
    }

    @Test
    void olmayanKategoriSilinmeyeCalisilirsa_resourceNotFoundFirlatilir() {
        Long categoryId = 99L;
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.delete(categoryId))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(releaseNoteRepository, never()).countByCategory_Id(any());
        verify(categoryRepository, never()).delete(any());
    }
}
