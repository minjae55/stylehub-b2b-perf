package kr.remerge.stylehub.global.auth.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

// JWT 토큰의 생성, 검증, 파싱을 담당하는 핵심 클래스
@Component
@RequiredArgsConstructor
public class JwtProvider {

    private final JwtProperties jwtProperties;

    // ───────────────────────────────────────────
    // 서명 키 생성
    // ───────────────────────────────────────────

    // yml에 설정한 secret 문자열을 실제 암호화 Key 객체로 변환
    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // ───────────────────────────────────────────
    // 토큰 생성
    // ───────────────────────────────────────────

    // 액세스 토큰 생성
    // userId, role, businessRole을 토큰 안에 담아서 발급
    public String generateAccessToken(Integer userId, Integer companyId, String role, String businessRole) {
        return buildToken(userId, companyId, role, businessRole, jwtProperties.getAccessTokenExpiration());
    }

    // 리프레시 토큰 생성
    public String generateRefreshToken(Integer userId) {
        // 1. setSubject(), setIssuedAt(), setExpiration() -> 모두 'set'이 제거된 최신 메서드로 변경
        // 2. signWith(Key, 알고리즘) -> signWith(Key) 하나로 변경 (jjwt가 키 길이를 보고 최적의 알고리즘을 자동 세팅함)
        return Jwts.builder()
                .subject(String.valueOf(userId))  // 토큰 주인 (userId)
                .issuedAt(new Date())             // 발급 시각
                .expiration(new Date(System.currentTimeMillis() + jwtProperties.getRefreshTokenExpiration())) // 만료 시각
                .signWith(getSigningKey())        // 서명 (알고리즘 명시 없이 Key만 전달하는 것이 최신 표준)
                .compact();
    }

    // 실제 토큰을 조립하는 내부 메서드
    private String buildToken(Integer userId, Integer companyId, String role, String businessRole, long expiration) {
        JwtBuilder builder = Jwts.builder()
                .subject(String.valueOf(userId))  // 토큰 주인 (userId)
                .claim("role", role)                 // ADMIN / PRESIDENT / EMPLOYEE
                .claim("businessRole", businessRole) // BUYER / SELLER / BOTH
                .issuedAt(new Date())             // 발급 시각
                .expiration(new Date(System.currentTimeMillis() + expiration)) // 만료 시각
                .signWith(getSigningKey());    // 서명

        // companyId가 있을 때만 클레임에 추가 (null 안전성 확보)
        if (companyId != null) {
            builder.claim("companyId", companyId);
        }

        return builder.compact();
    }

    // ───────────────────────────────────────────
    // 토큰 파싱
    // ───────────────────────────────────────────

    // 토큰에서 userId 추출
    public Integer getUserId(String token) {
        return Integer.parseInt(getClaims(token).getSubject());
    }

    // 토큰에서 role 추출
    public String getRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    // 토큰에서 businessRole 추출
    public String getBusinessRole(String token) {
        return getClaims(token).get("businessRole", String.class);
    }

    // 토큰에서 companyId 추출
    public Integer getCompanyId(String token) {
        return getClaims(token).get("companyId", Integer.class);
    }

    // 토큰을 파싱해서 Claims(페이로드 전체) 반환
    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey()) // 서명 키 검증 설정
                .build()                     // 파서 객체 빌드
                .parseSignedClaims(token)    // 토큰 해석 및 서명 검증
                .getPayload();               // 페이로드(Claims) 추출 (구버전의 getBody() 역할)
    }

    // ───────────────────────────────────────────
    // 토큰 검증
    // ───────────────────────────────────────────

    // 토큰이 유효한지 검사
    public boolean validateToken(String token) {
        try {
            getClaims(token); // 파싱 성공하면 유효한 토큰
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            // 위변조, 형식 오류 등 → 무조건 잘못된 토큰이므로 false 반환
            return false;
        }
    }

    // 토큰 만료 여부만 확인
    public boolean isExpired(String token) {
        try {
            getClaims(token);
            return false;
        } catch (ExpiredJwtException e) {
            return true; // 만료 예외가 터지면 true 반환
        }
    }

    // ───────────────────────────────────────────
// 비밀번호 재설정 토큰 생성 (추가할 부분)
// ───────────────────────────────────────────
    public String createPasswordResetToken(String email) {
        long passwordResetExpiration = 1800000L; // 30분 (30 * 60 * 1000)

        return Jwts.builder()
                .subject(email) // 비밀번호 재설정은 userId 대신 '이메일'을 주체로 담는 것이 추후 재설정 처리 시 편리합니다.
                .claim("purpose", "PASSWORD_RESET") // 일반 로그인 토큰과 구분하기 위한 용도 (보안 강화)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + passwordResetExpiration))
                .signWith(getSigningKey())
                .compact();
    }
}