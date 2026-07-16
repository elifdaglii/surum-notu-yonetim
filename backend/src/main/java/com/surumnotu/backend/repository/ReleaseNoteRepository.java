package com.surumnotu.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.surumnotu.backend.entity.ReleaseNote;

public interface ReleaseNoteRepository extends JpaRepository<ReleaseNote, Long> {

    List<ReleaseNote> findAllByOrderByReleaseDateDesc();

    List<ReleaseNote> findByCategory_IdOrderByReleaseDateDesc(Long categoryId);

    @Query("""
            SELECT r FROM ReleaseNote r
            WHERE LOWER(r.version) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(r.contentMarkdown) LIKE LOWER(CONCAT('%', :query, '%'))
            ORDER BY r.releaseDate DESC
            """)
    List<ReleaseNote> search(@Param("query") String query);
}
