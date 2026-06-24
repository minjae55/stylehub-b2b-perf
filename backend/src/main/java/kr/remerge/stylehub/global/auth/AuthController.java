package kr.remerge.stylehub.global.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import kr.remerge.stylehub.domain.user.UserService;
import kr.remerge.stylehub.domain.user.dto.request.FindIdSendOtpRequest;
import kr.remerge.stylehub.domain.user.dto.request.FindIdVerifyOtpRequest;
import kr.remerge.stylehub.domain.user.dto.request.FindPwRequest;
import kr.remerge.stylehub.domain.user.dto.response.FindIdResponse;
import kr.remerge.stylehub.global.auth.dto.ChangeAuthRequest;
import kr.remerge.stylehub.global.auth.dto.LoginRequest;
import kr.remerge.stylehub.global.auth.dto.TokenResponse;
import kr.remerge.stylehub.global.auth.dto.VerifyChangeAuthRequest;
import kr.remerge.stylehub.global.auth.jwt.JwtProperties;
import kr.remerge.stylehub.global.auth.security.CustomUserDetails;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final JwtProperties jwtProperties;

    // ───────────────────────────────────────────
    // 일반 로그인
    // ───────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Void>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        String clientIp = resolveClientIp(httpRequest);
        TokenResponse tokenResponse = authService.login(request, clientIp);

        // 💡 밀리초(ms)를 초(Seconds) 단위로 변환해서 쿠키 Max-Age에 주입
        long accessTokenMaxAge = jwtProperties.getAccessTokenExpiration() / 1000;
        long refreshTokenMaxAge = jwtProperties.getRefreshTokenExpiration() / 1000;

        ResponseCookie accessTokenCookie = createCookie(
                "accessToken", tokenResponse.accessToken(), accessTokenMaxAge);
        ResponseCookie refreshTokenCookie = createCookie(
                "refreshToken", tokenResponse.refreshToken(), refreshTokenMaxAge);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                .body(ApiResponse.successWithMessage("로그인 되었습니다."));
    }

    // ───────────────────────────────────────────
    // 액세스 토큰 재발급
    // ───────────────────────────────────────────
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Void>> refresh(
            @CookieValue(value = "refreshToken", required = false) String refreshToken) {

        if (refreshToken == null) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        TokenResponse tokenResponse = authService.refresh(refreshToken);
        long accessTokenMaxAge = jwtProperties.getAccessTokenExpiration() / 1000;
        ResponseCookie accessTokenCookie = createCookie(
                "accessToken", tokenResponse.accessToken(), accessTokenMaxAge);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString())
                .body(ApiResponse.successWithMessage("토큰이 재발급되었습니다."));
    }

    // ───────────────────────────────────────────
    // 로그아웃
    // ───────────────────────────────────────────
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @AuthenticationPrincipal CustomUserDetails userDetails) { // 💡 시큐리티 컨텍스트에서 유저 정보 주입

        // 💡 필수 반영: Redis에 저장된 리프레시 토큰도 함께 삭제
        if (userDetails != null) {
            authService.logout(userDetails.getUserId());
        }

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
    private ResponseCookie createCookie(String name, String value, long maxAgeSeconds) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .path("/")
                .maxAge(maxAgeSeconds)
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
    // 아이디 / 비밀번호 찾기 API
    // ───────────────────────────────────────────
    @PostMapping("/find-id/otp")
    public ResponseEntity<ApiResponse<Void>> sendFindIdOtp(@Valid @RequestBody FindIdSendOtpRequest request) {
        userService.sendFindIdOtp(request);
        return ResponseEntity.ok()
                .body(ApiResponse.successWithMessage("인증번호가 발송되었습니다."));
    }

    @PostMapping("/find-id/otp/verify")
    public ResponseEntity<ApiResponse<FindIdResponse>> verifyFindIdOtp(@Valid @RequestBody FindIdVerifyOtpRequest request) {
        FindIdResponse response = userService.verifyFindIdOtp(request);
        return ResponseEntity.ok()
                .body(ApiResponse.success(response));
    }

    @PostMapping("/find-pw")
    public ResponseEntity<ApiResponse<Void>> requestFindPassword(@Valid @RequestBody FindPwRequest request) {
        userService.requestFindPassword(request);
        return ResponseEntity.ok()
                .body(ApiResponse.successWithMessage("비밀번호 재설정 링크가 메일로 발송되었습니다."));
    }

    @PostMapping("/request-change-auth")
    public ResponseEntity<ApiResponse<Void>> requestChangeAuth(@Valid @RequestBody ChangeAuthRequest request) {
        authService.sendChangeAuthCode(request.target());
        return ResponseEntity.ok(ApiResponse.success());
    }

    @PostMapping("/verify-change-auth")
    public ResponseEntity<ApiResponse<Void>> verifyChangeAuth(@Valid @RequestBody VerifyChangeAuthRequest request) {
        authService.verifyChangeAuthCode(request.target(), request.code());
        return ResponseEntity.ok(ApiResponse.success());
    }
}