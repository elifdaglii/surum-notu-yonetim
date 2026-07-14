package com.surumnotu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.surumnotu.backend.entity.Category;

public interface CategoryRepository extends JpaRepository<Category, Long> {
}
