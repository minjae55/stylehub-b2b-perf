package kr.remerge.stylehub.global.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import kr.remerge.stylehub.domain.user.UserService;
import kr.remerge.stylehub.domain.user.dto.request.FindIdSendOtpRequest;
import kr.remerge.stylehub.domain.user.dto.request.FindIdVerifyOtpRequest;
import kr.remerge.stylehub.domain.user.dto.request.FindPwRequest;
import kr.remerge.stylehub.domain.user.dto.response.FindIdResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import kr.remerge.stylehub.global.auth.dto.LoginRequest;
import kr.remerge.stylehub.global.auth.dto.TokenResponse;
import kr.remerge.stylehub.global.response.ApiResponse;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;

import jakarta.validation.Valid;

// 인증 관련 API 엔드포인트
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    // 액세스 토큰 쿠키 만료 시간 (30분, JwtProperties와 맞추기)
    private static final int ACCESS_TOKEN_MAX_AGE = 60 * 30;
    // 리프레시 토큰 쿠키 만료 시간 (14일)
    private static final int REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 14;

    // ───────────────────────────────────────────
    // 일반 로그인
    // ───────────────────────────────────────────

    // POST /api/auth/login
    // 이메일 + 비밀번호로 로그인 → 액세스/리프레시 토큰을 HttpOnly 쿠키로 발급
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Void>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        // 클라이언트 IP 추출
        String clientIp = resolveClientIp(httpRequest);

        TokenResponse tokenResponse = authService.login(request, clientIp);

        // 토큰을 응답 본문이 아니라 쿠키로 발급
        ResponseCookie accessTokenCookie = createCookie(
                "accessToken", tokenResponse.accessToken(), ACCESS_TOKEN_MAX_AGE);
        ResponseCookie refreshTokenCookie = createCookie(
                "refreshToken", tokenResponse.refreshToken(), REFRESH_TOKEN_MAX_AGE);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                .body(ApiResponse.successWithMessage("로그인 되었습니다."));
    }

    // ───────────────────────────────────────────
    // 액세스 토큰 재발급
    // ───────────────────────────────────────────

    // POST /api/auth/refresh
    // 쿠키의 리프레시 토큰으로 새 액세스 토큰 발급
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Void>> refresh(
            @CookieValue(value = "refreshToken", required = false) String refreshToken) {

        if (refreshToken == null) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        TokenResponse tokenResponse = authService.refresh(refreshToken);

        // 새 액세스 토큰만 쿠키로 재발급 (리프레시 토큰은 그대로 유지)
        ResponseCookie accessTokenCookie = createCookie(
                "accessToken", tokenResponse.accessToken(), ACCESS_TOKEN_MAX_AGE);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString())
                .body(ApiResponse.successWithMessage("토큰이 재발급되었습니다."));
    }

    // ───────────────────────────────────────────
    // 로그아웃
    // ───────────────────────────────────────────

    /**
     * 로그아웃 API
     * POST /api/auth/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {

        ResponseCookie deleteAccessToken = createCookie("accessToken", "", 0);
        ResponseCookie deleteRefreshToken = createCookie("refreshToken", "", 0);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, deleteAccessToken.toString())
                .header(HttpHeaders.SET_COOKIE, deleteRefreshToken.toString())
                .body(ApiResponse.successWithMessage("로그아웃 되었습니다."));
    }

    // ───────────────────────────────────────────
    // 쿠키 생성 (내부 공통 메서드)
    // ───────────────────────────────────────────

    private ResponseCookie createCookie(String name, String value, int maxAgeSeconds) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)         // JS에서 접근 불가 (XSS 방어)
                .secure(true)           // 로컬 개발 단계라 false, 배포 시 true로 변경 필요
                .sameSite("None")       // 로컬 개발 단계, 배포 시 도메인 구조에 따라 조정
                .path("/")              // 모든 경로에서 쿠키 전송
                .maxAge(maxAgeSeconds)  // 만료 시간
                .build();
    }

    // ───────────────────────────────────────────
    // 클라이언트 IP 추출 (내부 메서드)
    // ───────────────────────────────────────────

    private String resolveClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    // ───────────────────────────────────────────
    // 아이디 / 비밀번호 찾기 API (추가할 부분)
    // ───────────────────────────────────────────

    /**
     * 1. 아이디 찾기 - OTP 인증번호 발송
     * POST /api/auth/find-id/otp
     */
    @PostMapping("/find-id/otp")
    public ResponseEntity<ApiResponse<Void>> sendFindIdOtp(@Valid @RequestBody FindIdSendOtpRequest request) {
        userService.sendFindIdOtp(request);
        return ResponseEntity.ok()
                .body(ApiResponse.successWithMessage("인증번호가 발송되었습니다."));
    }

    /**
     * 2. 아이디 찾기 - OTP 인증번호 검증 및 결과 반환
     * POST /api/auth/find-id/otp/verify
     */
    @PostMapping("/find-id/otp/verify")
    public ResponseEntity<ApiResponse<FindIdResponse>> verifyFindIdOtp(@Valid @RequestBody FindIdVerifyOtpRequest request) {
        FindIdResponse response = userService.verifyFindIdOtp(request);
        return ResponseEntity.ok()
                .body(ApiResponse.success(response));
    }

    /**
     * 3. 비밀번호 찾기 - 재설정 이메일 발송
     * POST /api/auth/find-pw
     */
    @PostMapping("/find-pw")
    public ResponseEntity<ApiResponse<Void>> requestFindPassword(@Valid @RequestBody FindPwRequest request) {
        userService.requestFindPassword(request);
        return ResponseEntity.ok()
                .body(ApiResponse.successWithMessage("비밀번호 재설정 링크가 메일로 발송되었습니다."));
    }
}