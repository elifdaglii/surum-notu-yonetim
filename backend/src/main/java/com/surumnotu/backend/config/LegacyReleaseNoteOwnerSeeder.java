package com.surumnotu.backend.config;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.surumnotu.backend.entity.ReleaseNote;
import com.surumnotu.backend.entity.Role;
import com.surumnotu.backend.entity.User;
import com.surumnotu.backend.repository.ReleaseNoteRepository;
import com.surumnotu.backend.repository.UserRepository;

// createdBy alani sonradan eklendigi icin ondan once olusturulmus surum notlarinin bu
// alani bos (null). ADMIN zaten her notu yonetebildigi icin bu bir yetki acigi degil,
// ama arsivde "kimin olusturdugu belirsiz" notlar birikmesin diye ilk ADMIN kullaniciya
// devrediyoruz. AdminUserSeeder'dan (Order=1) sonra calismali ki devredilecek bir admin
// bulunsun.
@Component
@Order(2)
public class LegacyReleaseNoteOwnerSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(LegacyReleaseNoteOwnerSeeder.class);

    private final ReleaseNoteRepository releaseNoteRepository;
    private final UserRepository userRepository;

    public LegacyReleaseNoteOwnerSeeder(ReleaseNoteRepository releaseNoteRepository, UserRepository userRepository) {
        this.releaseNoteRepository = releaseNoteRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        List<ReleaseNote> orphanNotes = releaseNoteRepository.findByCreatedByIsNull();
        if (orphanNotes.isEmpty()) {
            return;
        }

        userRepository.findFirstByRole(Role.ADMIN).ifPresentOrElse(
                admin -> {
                    orphanNotes.forEach(note -> note.setCreatedBy(admin));
                    releaseNoteRepository.saveAll(orphanNotes);
                    log.info("{} adet sahipsiz surum notu '{}' admin kullanicisina atandi.",
                            orphanNotes.size(), admin.getUsername());
                },
                () -> log.warn("{} adet sahipsiz surum notu var ama devredilecek bir ADMIN kullanici bulunamadi.",
                        orphanNotes.size())
        );
    }
}
