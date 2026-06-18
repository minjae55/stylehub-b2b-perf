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
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;
/*
───────────────────────────────────────────
필터 실행 순서
───────────────────────────────────────────
HTTP 요청
    ↓
JwtFilter          # 토큰 검증 → SecurityContext 저장
    ↓
UsernamePasswordAuthenticationFilter  # (JWT 방식에선 거의 안 탐)
        ↓
Controller
───────────────────────────────────────────
역할별 접근 제어 두 가지 방법
───────────────────────────────────────────
// 방법 1 - SecurityConfig에서 URL 단위로
.requestMatchers("/api/admin/**").hasRole("ADMIN")

// 방법 2 - Controller에서 메서드 단위로 (@EnableMethodSecurity 필요)
@PreAuthorize("hasRole('ADMIN')")
@GetMapping("/api/admin/users")
public ApiResponse<?> getUsers() { ... }
*/

// Spring Security 전체 설정을 담당하는 클래스
// @EnableWebSecurity : Security 활성화
// @EnableMethodSecurity : @PreAuthorize, @PostAuthorize 등 메서드 레벨 보안 활성화
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private static final String[] PUBLIC_URLS = {
            "/api/**",
            //"/api/auth/**",         // 로그인, 회원가입, 토큰 재발급
            // "/api/cart/**",
            //"/swagger-ui/**",       // Swagger UI
            // "/v3/api-docs/**",      // Swagger API 문서
    };
    private final JwtFilter jwtFilter;
//    private final CustomOAuth2UserService customOAuth2UserService;
//    private final OAuth2SuccessHandler oAuth2SuccessHandler;

    // ───────────────────────────────────────────
    // 인증 없이 접근 가능한 URL 목록
    // ───────────────────────────────────────────
    private final CorsConfigurationSource corsConfigurationSource;

    // ───────────────────────────────────────────
    // Security 필터 체인 설정
    // ───────────────────────────────────────────

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. CSRF 비활성화
                //    REST API + JWT 방식에서는 세션을 사용하지 않으므로 CSRF 불필요
                .csrf(AbstractHttpConfigurer::disable)

                // 2. CORS 설정 적용
                .cors(cors -> cors.configurationSource(corsConfigurationSource))

                // 3. 세션 비활성화
                //    JWT 방식은 서버가 세션을 유지하지 않음 (STATELESS)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 4. URL별 접근 권한 설정
                .authorizeHttpRequests(auth -> auth
                        // PUBLIC_URLS는 인증 없이 접근 가능
                        .requestMatchers(PUBLIC_URLS).permitAll()

                        // /api/admin/** 은 ADMIN 역할만 접근 가능
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // 그 외 모든 요청은 인증 필요
                        .anyRequest().authenticated()
                )
/*
                // 5. OAuth2 소셜 로그인 설정
                .oauth2Login(oauth2 -> oauth2
                        // 소셜 로그인 후 유저 정보 처리
                        .userInfoEndpoint(userInfo ->
                                userInfo.userService(customOAuth2UserService))
                        // 소셜 로그인 성공 시 JWT 발급
                        .successHandler(oAuth2SuccessHandler)
                        // 소셜 로그인 실패 시
                        .failureUrl("/api/auth/oauth2/failure")
                )
*/

                // 6. JwtFilter를 UsernamePasswordAuthenticationFilter 앞에 등록
                //    모든 요청이 JwtFilter를 먼저 거치도록 설정
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ───────────────────────────────────────────
    // 공통 Bean 등록
    // ───────────────────────────────────────────

    // 비밀번호 암호화에 사용하는 인코더
    // BCrypt : 단방향 해시 암호화, 복호화 불가
    // AuthService에서 로그인 시 비밀번호 검증에 사용
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // AuthenticationManager : 로그인 시 이메일/비밀번호 검증을 처리하는 객체
    // AuthService에서 직접 로그인 처리할 때 주입받아 사용
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}