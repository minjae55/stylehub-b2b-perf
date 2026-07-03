package kr.remerge.stylehub.global.auth;

import kr.remerge.stylehub.global.auth.jwt.JwtFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    // 💡 인증 없이 접근 가능한 URL 목록 정돈
    private static final String[] PUBLIC_URLS = {
            "/api/**"
    };

    private final JwtFilter jwtFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    // ───────────────────────────────────────────
    // Security 필터 체인 설정
    // ───────────────────────────────────────────
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. CSRF 비활성화 (REST API 환경)
                .csrf(AbstractHttpConfigurer::disable)

                // 2. CORS 설정 적용
                .cors(cors -> cors.configurationSource(corsConfigurationSource))

                // 3. JWT 사용을 위한 세션 비활성화
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 4. URL별 접근 권한 설정
                .authorizeHttpRequests(auth -> auth
                        // 무인증 통과 주소 적용
                        .requestMatchers(PUBLIC_URLS).permitAll()
                        // 관리자 전용 기능 제어
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        // 그 외 모든 요청은 기본 인증 필요
                        .anyRequest().authenticated()
                )

                // 5. JwtFilter를 UsernamePasswordAuthenticationFilter 앞에 등록
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ───────────────────────────────────────────
    // 공통 Bean 등록
    // ───────────────────────────────────────────

    // 수동 인증 처리를 담당할 매니저 빈 등록
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}