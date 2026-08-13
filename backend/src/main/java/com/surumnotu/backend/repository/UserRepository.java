package com.surumnotu.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.surumnotu.backend.entity.Role;
import com.surumnotu.backend.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    // Kullanici guncellenirken username unique kontrolu icin - kendi mevcut kaydini
    // (ayni id) carpisma sanmasin diye id disarida tutuluyor.
    boolean existsByUsernameAndIdNot(String username, Long id);

    Optional<User> findByResetToken(String resetToken);

    Optional<User> findFirstByRole(Role role);

    boolean existsByRole(Role role);

    long countByRole(Role role);
}
