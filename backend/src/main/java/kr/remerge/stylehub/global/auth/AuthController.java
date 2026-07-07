package kr.remerge.stylehub.global.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import kr.remerge.stylehub.global.auth.dto.SignUpAuth;
import kr.remerge.stylehub.global.auth.dto.change.ChangeAuthRequest;
import kr.remerge.stylehub.global.auth.dto.change.VerifyChangeAuthRequest;
import kr.remerge.stylehub.global.auth.dto.find.*;
import kr.remerge.stylehub.global.auth.dto.login.AuthUser;
import kr.remerge.stylehub.global.auth.dto.login.LoginRequest;
import kr.remerge.stylehub.global.auth.dto.token.TokenResponse;
import kr.remerge.stylehub.global.auth.jwt.JwtProperties;
import kr.remerge.stylehub.global.auth.security.LoginUser;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtProperties jwtProperties;

    // ───────────────────────────────────────────
    // 로그인
    // ───────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Void>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        String clientIp = resolveClientIp(httpRequest);
        TokenResponse tokenResponse = authService.login(request, clientIp);

        ResponseCookie accessTokenCookie;
        ResponseCookie refreshTokenCookie;
        long accessTokenMaxAge = jwtProperties.getAccessTokenExpiration() / 1000;
        accessTokenCookie = createCookie("accessToken", tokenResponse.accessToken(), accessTokenMaxAge);

        if (request.rememberMe()) {
            // 1. '로그인 상태 유지' 체크 시: Max-Age를 명시적으로 부여 (지정된 시간만큼 유지)
            long refreshTokenMaxAge = jwtProperties.getRefreshTokenExpiration() / 1000;
            refreshTokenCookie = createCookie("refreshToken", tokenResponse.refreshToken(), refreshTokenMaxAge);
        } else {
            // 2. 미체크 시: Max-Age 설정을 아예 제외하여 '세션 쿠키'로 생성 (브라우저 종료 시 만료)
            refreshTokenCookie = createSessionCookie("refreshToken", tokenResponse.refreshToken());
        }

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

        // 1. 쿠키 자체가 없으면 바로 에러
        if (refreshToken == null) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        try {
            // 2. 정상 재발급 흐름
            TokenResponse tokenResponse = authService.refresh(refreshToken);
            long accessTokenMaxAge = jwtProperties.getAccessTokenExpiration() / 1000;
            ResponseCookie accessTokenCookie = createCookie(
                    "accessToken", tokenResponse.accessToken(), accessTokenMaxAge);

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString())
                    .body(ApiResponse.successWithMessage("토큰이 재발급되었습니다."));

        } catch (BusinessException e) {
            // 레디스에 토큰이 없거나 만료되어 예외가 터지면 쿠키를 싹 구워서 구워 날려줍니다.
            ResponseCookie deleteAccessToken = createCookie("accessToken", "", 0);
            ResponseCookie deleteRefreshToken = createCookie("refreshToken", "", 0);

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.SET_COOKIE, deleteAccessToken.toString());
            headers.add(HttpHeaders.SET_COOKIE, deleteRefreshToken.toString());

            // 쿠키 삭제 헤더를 실어서 에러 응답을 내려보냅니다.
            return ResponseEntity.status(e.getErrorCode().getHttpStatus())
                    .headers(headers)
                    .body(ApiResponse.fail(e.getErrorCode()));
        }
    }
// ───────────────────────────────────────────
    // 회원가입 (Register Step 1) 전용 이메일/휴대폰 인증
    // ───────────────────────────────────────────

    /**
     * 회원가입 - 이메일 중복 확인 (디바운스 대응)
     * GET /api/auth/email/check?email=...
     */
    @GetMapping("/email/check")
    public ResponseEntity<ApiResponse<Void>> checkEmailDuplicate(@Valid @ModelAttribute SignUpAuth.EmailCheckRequest request) {
        authService.checkEmailDuplicateForSignUp(request.email());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * 회원가입 - 이메일 인증코드 발송
     * POST /api/auth/email/send
     */
    @PostMapping("/email/send")
    public ResponseEntity<ApiResponse<Void>> sendSignUpEmailOtp(
            @Valid @RequestBody SignUpAuth.EmailSendRequest request) {
        authService.sendSignUpEmailOtp(request.email());
        return ResponseEntity.ok(ApiResponse.successWithMessage("인증 코드가 이메일로 발송되었습니다."));
    }

    /**
     * 회원가입 - 이메일 인증코드 검증
     * POST /api/auth/email/verify
     */
    @PostMapping("/email/verify")
    public ResponseEntity<ApiResponse<Void>> verifySignUpEmailOtp(
            @Valid @RequestBody SignUpAuth.EmailVerifyRequest request) {
        authService.verifySignUpEmailOtp(request.email(), request.code());
        return ResponseEntity.ok(ApiResponse.successWithMessage("이메일 인증이 완료되었습니다."));
    }

    @GetMapping("/phone/check")
    public ResponseEntity<ApiResponse<Void>> checkPhoneDuplicate(@Valid @ModelAttribute SignUpAuth.PhoneCheckRequest request) {
        authService.checkPhoneDuplicateForSignUp(request.phone());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * 회원가입 - 휴대폰 인증번호 발송 (SENS SMS)
     * POST /api/auth/phone/send
     */
    @PostMapping("/phone/send")
    public ResponseEntity<ApiResponse<Void>> sendSignUpPhoneOtp(
            @Valid @RequestBody SignUpAuth.PhoneSendRequest request) {
        authService.sendSignUpPhoneOtp(request.phone());
        return ResponseEntity.ok(ApiResponse.successWithMessage("인증번호가 문자로 발송되었습니다."));
    }

    /**
     * 회원가입 - 휴대폰 인증번호 검증
     * POST /api/auth/phone/verify
     */
    @PostMapping("/phone/verify")
    public ResponseEntity<ApiResponse<Void>> verifySignUpPhoneOtp(
            @Valid @RequestBody SignUpAuth.PhoneVerifyRequest request) {
        authService.verifySignUpPhoneOtp(request.phone(), request.code());
        return ResponseEntity.ok(ApiResponse.successWithMessage("휴대폰 본인인증이 완료되었습니다."));
    }
    // ───────────────────────────────────────────
    // 로그아웃
    // ───────────────────────────────────────────
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @LoginUser AuthUser user) {

        // 필수 반영: Redis에 저장된 리프레시 토큰도 함께 삭제
        if (user != null) {
            authService.logout(user.userId());
        }

        ResponseCookie deleteAccessToken = createCookie("accessToken", "", 0);
        ResponseCookie deleteRefreshToken = createCookie("refreshToken", "", 0);

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, deleteAccessToken.toString());
        headers.add(HttpHeaders.SET_COOKIE, deleteRefreshToken.toString());

        return ResponseEntity.ok()
                .headers(headers)
                .body(ApiResponse.successWithMessage("로그아웃 되었습니다."));
    }

    // ───────────────────────────────────────────
    // 쿠키 생성 (내부 공통 메서드)
    // ───────────────────────────────────────────
    private ResponseCookie createCookie(String name, String value, long maxAgeSeconds) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(false) // true | false
                .sameSite("Lax") // None | Lax
                .path("/")
                .maxAge(maxAgeSeconds)
                .build();
    }

    // 세션 쿠키 생성 (Max-Age 없음 )
    private ResponseCookie createSessionCookie(String name, String value) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
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

    /**
     * 1단계: 아이디 찾기 인증번호 발송
     */
    @PostMapping("/find-id/send-otp")
    public ResponseEntity<ApiResponse<Void>> sendFindIdOtp(@Valid @RequestBody FindIdSendOtpRequest request) {
        authService.sendFindIdOtp(request);
        return ResponseEntity.ok()
                .body(ApiResponse.successWithMessage("인증번호가 발송되었습니다."));
    }

    /**
     * 2단계: 아이디 찾기 인증번호 검증 및 아이디 반환
     */
    @PostMapping("/find-id/verify-otp")
    public ResponseEntity<ApiResponse<FindIdResponse>> verifyFindIdOtp(@Valid @RequestBody FindIdVerifyOtpRequest request) {
        FindIdResponse response = authService.verifyFindIdOtp(request);
        return ResponseEntity.ok()
                .body(ApiResponse.success(response));
    }

    /**
     * 비밀번호 찾기 - 1단계: 이메일 인증번호 발송
     * POST /api/auth/find-pw/send-otp
     */
    @PostMapping("/find-pw/send-otp")
    public ResponseEntity<ApiResponse<Void>> sendFindPwOtp(
            @RequestBody @Valid FindPwSendOtpRequest request
    ) {
        authService.sendFindPwOtp(request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * 비밀번호 찾기 - 2단계: 인증번호 검증 및 1회성 임시 재설정 토큰 발급
     * POST /api/auth/find-pw/verify-otp
     */
    @PostMapping("/find-pw/verify-otp")
    public ResponseEntity<ApiResponse<ResetPasswordTokenResponse>> verifyFindPwOtp(
            @RequestBody @Valid FindPwVerifyOtpRequest request
    ) {
        ResetPasswordTokenResponse response = authService.verifyFindPwOtp(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 비밀번호 찾기 - 3단계: 1회성 토큰 검증 후 새 비밀번호로 최종 변경
     * POST /api/auth/find-pw/reset
     */
    @PostMapping("/find-pw/reset")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @RequestBody @Valid ResetPasswordRequest request
    ) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ───────────────────────────────────────────
    // 회원정보 변경 시 이메일/휴대폰 본인 점유인증 (마이페이지 연동용)
    // ───────────────────────────────────────────

    @PostMapping("/change-id/send-otp")
    public ResponseEntity<ApiResponse<Void>> sendChangeIdOtp(@Valid @RequestBody ChangeAuthRequest request) {
        authService.sendChangeIdOtp(request.target());
        return ResponseEntity.ok(ApiResponse.successWithMessage("인증 코드가 발송되었습니다."));
    }

    @PostMapping("/change-id/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyChangeIdOtp(@Valid @RequestBody VerifyChangeAuthRequest request) {
        authService.verifyChangeIdOtp(request.target(), request.otpCode());
        return ResponseEntity.ok(ApiResponse.successWithMessage("인증이 완료되었습니다."));
    }

    @PostMapping("/change-phone/send-otp")
    public ResponseEntity<ApiResponse<Void>> sendChangePhoneOtp(@Valid @RequestBody ChangeAuthRequest request) {
        authService.sendChangePhoneOtp(request.target());
        return ResponseEntity.ok(ApiResponse.successWithMessage("인증 코드가 발송되었습니다."));
    }

    @PostMapping("/change-phone/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyChangePhoneOtp(@Valid @RequestBody VerifyChangeAuthRequest request) {
        authService.verifyChangePhoneOtp(request.target(), request.otpCode());
        return ResponseEntity.ok(ApiResponse.successWithMessage("인증이 완료되었습니다."));
    }
}