package kr.remerge.stylehub.global.auth;

import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import kr.remerge.stylehub.global.auth.dto.LoginRequest;
import kr.remerge.stylehub.global.auth.dto.TokenResponse;
import kr.remerge.stylehub.global.auth.jwt.JwtProperties;
import kr.remerge.stylehub.global.auth.jwt.JwtProvider;
import kr.remerge.stylehub.global.common.RedisRepository;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final RedisRepository redisRepository;
    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProperties jwtProperties;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // 💡 피드백 반영: yaml 파일 설정을 직접 읽어오도록 변경 (밀리초 단위)


    // ───────────────────────────────────────────
    // 일반 로그인
    // ───────────────────────────────────────────
    @Transactional
    public TokenResponse login(LoginRequest request, String clientIp) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        validateUserStatus(user);

        if (user.getFailedLoginAttempts() >= 5) {
            throw new BusinessException(ErrorCode.LOGIN_ATTEMPTS_EXCEEDED);
        }

        boolean passwordMatched = passwordEncoder.matches(request.password(), user.getPassword());

        if (!passwordMatched) {
            user.onLoginFailed();
            throw new BusinessException(ErrorCode.INVALID_PASSWORD);
        }

        user.onLoginSuccess(clientIp);

        String accessToken = jwtProvider.generateAccessToken(
                user.getUserId(),
                user.getCompany().getCompanyId(),
                user.getRole().name(),
                user.getBusinessRole().name()
        );
        String refreshToken = jwtProvider.generateRefreshToken(user.getUserId());

        redisRepository.save(
                refreshTokenKey(user.getUserId()),
                refreshToken,
                Duration.ofMillis(jwtProperties.getRefreshTokenExpiration())
        );

        return TokenResponse.of(accessToken, refreshToken);
    }

    // ───────────────────────────────────────────
    // 액세스 토큰 재발급 (Refresh)
    // ───────────────────────────────────────────
    @Transactional(readOnly = true)
    public TokenResponse refresh(String refreshToken) {
        if (jwtProvider.isExpired(refreshToken)) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        Integer userId = jwtProvider.getUserId(refreshToken);

        String savedRefreshToken = redisRepository.get(refreshTokenKey(userId));
        if (savedRefreshToken == null || !savedRefreshToken.equals(refreshToken)) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        validateUserStatus(user);

        String newAccessToken = jwtProvider.generateAccessToken(
                user.getUserId(),
                user.getCompany().getCompanyId(),
                user.getRole().name(),
                user.getBusinessRole().name());

        return TokenResponse.of(newAccessToken, refreshToken);
    }

    // ───────────────────────────────────────────
    // 로그아웃 (Logout)
    // ───────────────────────────────────────────
    public void logout(Integer userId) {
        redisRepository.delete(refreshTokenKey(userId));
    }

    private void validateUserStatus(User user) {
        switch (user.getStatus()) {
            case PENDING -> throw new BusinessException(ErrorCode.USER_PENDING);
            case SUSPENDED -> throw new BusinessException(ErrorCode.USER_SUSPENDED);
            case DELETED -> throw new BusinessException(ErrorCode.USER_DELETED);
            default -> {}
        }
    }

    // ───────────────────────────────────────────
    // 정보 변경을 위한 인증 코드 발송 및 검증
    // ───────────────────────────────────────────
    public void sendChangeAuthCode(String target) {
        String otpCode = String.format("%06d", SECURE_RANDOM.nextInt(1000000));
        saveOtp(target, otpCode);
    }

    public void verifyChangeAuthCode(String target, String code) {
        validateOtpCode(target, code);
        redisRepository.save(verificationKey(target), "true", Duration.ofMinutes(10));
        redisRepository.delete(target);
    }

    // ───────────────────────────────────────────
    // 아이디 찾기 / 공통 OTP 검증 및 삭제
    // ───────────────────────────────────────────
    public void sendFindIdOtp(String phone, String otpCode) {
        saveOtp(phone, otpCode);
    }

    public void verifyOtpAndClear(String phone, String code) {
        validateOtpCode(phone, code);
        redisRepository.delete(phone);
    }

    // ───────────────────────────────────────────
    // 회원정보 수정 시 '이메일 인증 여부' 검증 정책
    // ───────────────────────────────────────────
    public void validateVerification(String target) {
        if (isNotVerified(target)) {
            throw new BusinessException(ErrorCode.UNVERIFIED_EMAIL);
        }
        invalidateVerification(target);
    }

    public boolean isNotVerified(String target) {
        return !isVerified(target);
    }

    public boolean isVerified(String target) {
        String authStatus = redisRepository.get(verificationKey(target));
        return "true".equals(authStatus);
    }

    public void invalidateVerification(String target) {
        redisRepository.delete(verificationKey(target));
    }

    // ───────────────────────────────────────────
    // 내부 헬퍼 메서드 (Private Helpers)
    // ───────────────────────────────────────────
    private void validateOtpCode(String target, String code) {
        String savedCode = redisRepository.get(target);
        if (savedCode == null) {
            throw new BusinessException(ErrorCode.OTP_EXPIRED);
        }
        if (!savedCode.equals(code)) {
            throw new BusinessException(ErrorCode.INVALID_OTP_CODE);
        }
    }

    private void saveOtp(String target, String code) {
        redisRepository.save(target, code, Duration.ofMinutes(3));
    }

    private String verificationKey(String target) {
        return "VERIFIED:" + target;
    }

    private String refreshTokenKey(Integer userId) {
        return "REFRESH_TOKEN:" + userId;
    }
}