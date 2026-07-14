package com.surumnotu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.surumnotu.backend.entity.ReleaseNote;

public interface ReleaseNoteRepository extends JpaRepository<ReleaseNote, Long> {
}
