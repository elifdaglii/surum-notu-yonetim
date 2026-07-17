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

    public UserResponse createUser(String username, String rawPassword, Role role) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new UsernameAlreadyExistsException(username);
        }

        User user = User.builder()
                .username(username)
                .password(passwordEncoder.encode(rawPassword))
                .role(role)
                .build();

        return toResponse(userRepository.save(user));
    }

    public List<UserResponse> listUsers() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanici bulunamadi: " + id));

        if (user.getRole() == Role.ADMIN && userRepository.countByRole(Role.ADMIN) <= 1) {
            throw new LastAdminException("Sistemde en az bir ADMIN kalmali, bu kullanici silinemez");
        }

        userRepository.delete(user);
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getRole());
    }
}
