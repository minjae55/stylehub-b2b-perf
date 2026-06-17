package kr.remerge.stylehub.global.auth.jwt;

import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import kr.remerge.stylehub.global.auth.security.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/*
───────────────────────────────────────────
전체 흐름 ──────────────────────────────────────
───────────────────────────────────────────
HTTP 요청
    ↓
JwtFilter.doFilterInternal()
    ↓
resolveToken()                                 # Authorization 헤더에서 토큰 추출
    ↓
jwtProvider.validateToken()                    # 유효한지 검증
    ↓
customUserDetailsService.loadUserByUsername()  # DB에서 유저 로드
    ↓
SecurityContextHolder에 인증 정보 저장
    ↓
Controller 도달 → @AuthenticationPrincipal로 유저 꺼내 쓰기
───────────────────────────────────────────
만료 시 클라이언트 흐름 ───────────────────────────────
───────────────────────────────────────────
액세스 토큰 만료 → 401 응답
    ↓
React에서 감지
↓
/api/auth/refresh 요청 (리프레시 토큰 전달)
    ↓
새 액세스 토큰 발급
*/
// 모든 HTTP 요청마다 딱 한 번 실행되는 JWT 인증 필터
// OncePerRequestFilter : 요청당 1번만 실행을 보장하는 Spring 필터 베이스 클래스
// 모든 HTTP 요청마다 딱 한 번 실행되는 JWT 인증 필터
@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // 1. 쿠키에서 토큰 추출
        String token = resolveToken(request);

        // 2. 토큰이 없으면 그냥 다음 필터로 넘김
        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. 토큰 검증
        try {
            if (jwtProvider.validateToken(token)) {
                // 4. 토큰에서 userId 추출
                Integer userId = jwtProvider.getUserId(token);

                // 5. userId로 DB에서 유저 정보 로드
                UserDetails userDetails = customUserDetailsService.loadUserByUsername(String.valueOf(userId));

                // 6. 인증 객체 생성
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                // 7. SecurityContext에 인증 정보 저장
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (ExpiredJwtException e) {
            // 액세스 토큰 만료 → 클라이언트가 /api/auth/refresh 호출해야 함
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\": \"액세스 토큰이 만료되었습니다.\"}");
            return;
        }

        // 8. 다음 필터로 넘김
        filterChain.doFilter(request, response);
    }

    // ───────────────────────────────────────────
    // 쿠키에서 토큰 추출
    // ───────────────────────────────────────────

    // accessToken 이름의 쿠키 값을 꺼냄
    private String resolveToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }

        for (Cookie cookie : cookies) {
            if (cookie.getName().equals("accessToken")) {
                return cookie.getValue();
            }
        }
        return null;
    }
}