package com.surumnotu.backend.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.surumnotu.backend.dto.UserResponse;
import com.surumnotu.backend.entity.Role;
import com.surumnotu.backend.entity.User;
import com.surumnotu.backend.repository.UserRepository;

@Service
public class UserManagementService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserManagementService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserResponse createUser(String username, String rawPassword, Role role, String email) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new UsernameAlreadyExistsException(username);
        }

        User user = User.builder()
                .username(username)
                .password(passwordEncoder.encode(rawPassword))
                .role(role)
                .email(email)
                .build();

        return toResponse(userRepository.save(user));
    }

    public List<UserResponse> listUsers() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    // currentUsername: istegi yapan (giris yapmis) admin'in kullanici adi - hem
    // "kendi rolunu dusuremez" kontrolu hem de son ADMIN korumasi icin lazim.
    public UserResponse updateUser(Long id, String username, String rawPassword, Role role, String email,
            String currentUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı: " + id));

        if (userRepository.existsByUsernameAndIdNot(username, id)) {
            throw new UsernameAlreadyExistsException(username);
        }

        boolean isSelf = user.getUsername().equals(currentUsername);
        boolean isDemotingFromAdmin = user.getRole() == Role.ADMIN && role != Role.ADMIN;

        // Admin kendi rolunu USER'a dusuremez - digger admin sayisindan bagimsiz,
        // oturum ortasinda kendi kendini yetkisiz birakmasin diye kosulsuz engelleniyor.
        if (isSelf && isDemotingFromAdmin) {
            throw new LastAdminException("Kendi admin rolünüzü kaldıramazsınız");
        }

        if (isDemotingFromAdmin && userRepository.countByRole(Role.ADMIN) <= 1) {
            throw new LastAdminException("Sistemde en az bir ADMIN kalmalı, bu kullanıcının rolü değiştirilemez");
        }

        user.setUsername(username);
        user.setRole(role);
        user.setEmail(email);
        if (rawPassword != null && !rawPassword.isBlank()) {
            user.setPassword(passwordEncoder.encode(rawPassword));
        }

        return toResponse(userRepository.save(user));
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı: " + id));

        if (user.getRole() == Role.ADMIN && userRepository.countByRole(Role.ADMIN) <= 1) {
            throw new LastAdminException("Sistemde en az bir ADMIN kalmalı, bu kullanıcı silinemez");
        }

        userRepository.delete(user);
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getRole(), user.getEmail());
    }
}
