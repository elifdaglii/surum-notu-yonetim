package com.surumnotu.backend.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthFilter) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // /api/auth/register BİLEREK burada değil - kimlik doğrulaması gerektiren
                        // .anyRequest().authenticated() kuralına düşüyor + AuthController'da
                        // @PreAuthorize("hasRole('ADMIN')") ile ek olarak ADMIN'e kısıtlanıyor.
                        // Self-servis kayıt kapatıldı (önceki karar); kullanıcı oluşturmanın tek
                        // yolu artık /api/admin/users (bkz. AdminController).
                        .requestMatchers("/api/auth/login", "/api/auth/forgot-password",
                                "/api/auth/reset-password", "/error").permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // React dev server'i (Vite, varsayilan port 5173) farkli bir origin sayildigi icin
    // tarayici bu izin olmadan fetch/axios isteklerinin cevabini JS koduna vermez.
    // Vite, 5173 mesgulse otomatik olarak sonraki bos porta (5174, 5175, ...) gecer;
    // bu yuzden sabit port yerine pattern kullaniyoruz ki port degisince CORS kirilmasin.
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("http://localhost:*", "http://127.0.0.1:*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
