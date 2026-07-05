package kr.remerge.stylehub.global.auth.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import kr.remerge.stylehub.global.auth.dto.login.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/*
───────────────────────────────────────────
전체 흐름
───────────────────────────────────────────
HTTP 요청
    ↓
JwtFilter.doFilterInternal()
    ↓
resolveToken()                                 # 쿠키(accessToken)에서 토큰 추출
    ↓
jwtProvider.validateToken()                    # 유효한지 검증
    ↓
AuthService.loadUserByUserId()    # 토큰 내부의 userId로 유저 로드
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
/Aapi/auth/refresh 요청 (리프레시 토큰 전달)
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

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        String token = resolveToken(request);

        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            Claims claims = jwtProvider.parseClaims(token);

            Integer userId = Integer.parseInt(claims.getSubject());
            Integer companyId = claims.get("companyId", Integer.class);
            String role = claims.get("role", String.class);
            String businessRole = claims.get("businessRole", String.class);

            AuthUser authUser = new AuthUser(userId, companyId, role, businessRole);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            authUser,
                            null,
                            List.of(
                                    new SimpleGrantedAuthority("ROLE_" + role),
                                    new SimpleGrantedAuthority("ROLE_" + businessRole))
                    );

            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (JwtException | IllegalArgumentException e) {
            SecurityContextHolder.clearContext();
        }

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
            if ("accessToken".equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}