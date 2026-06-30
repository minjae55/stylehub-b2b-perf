package kr.remerge.stylehub.global.auth;

import kr.remerge.stylehub.domain.user.dto.response.FindIdResponse;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import kr.remerge.stylehub.global.auth.dto.change.LoginRequest;
import kr.remerge.stylehub.global.auth.dto.change.TokenResponse;
import kr.remerge.stylehub.global.auth.dto.find.*;
import kr.remerge.stylehub.global.auth.jwt.JwtProperties;
import kr.remerge.stylehub.global.auth.jwt.JwtProvider;
import kr.remerge.stylehub.global.common.RedisRepository;
import kr.remerge.stylehub.global.common.service.EmailService;
import kr.remerge.stylehub.global.common.service.SmsService;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
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
    private final EmailService emailService;         // 이메일 보내기 서비스
    private final SmsService smsService;             // 알림톡 또는 SMS 발송 서비스


    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // ───────────────────────────────────────────
    // 일반 로그인
    // ───────────────────────────────────────────
    @Transactional
    public TokenResponse login(LoginRequest request, String clientIp) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_LOGIN_CREDENTIALS));

        validateUserStatus(user);

        if (user.getFailedLoginAttempts() >= 5) {
            throw new BusinessException(ErrorCode.LOGIN_ATTEMPTS_EXCEEDED);
        }

        boolean passwordMatched = passwordEncoder.matches(request.password(), user.getPassword());

        if (!passwordMatched) {
            user.onLoginFailed();
            throw new BusinessException(ErrorCode.INVALID_LOGIN_CREDENTIALS);
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
    // 아이디 찾기 - OTP 인증번호 발송
    // ───────────────────────────────────────────
    public void sendFindIdOtp(FindIdSendOtpRequest request) {
        // 1. 유저 존재 여부 확인 (UserRepository 바로 활용)
        if (!userRepository.existsByNameAndPhone(request.name(), request.phone())) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

        // 2. 난수 생성 및 Redis 저장
        String otpCode = String.format("%06d", SECURE_RANDOM.nextInt(1000000));
        redisRepository.save("SMS_AUTH:" + request.phone(), otpCode, Duration.ofMinutes(3));

        // 3. 문자 발송
        String messageContent = "[StyleHub] 인증번호 [" + otpCode + "]를 입력해주세요.";
        boolean isSent = smsService.sendSms(request.phone(), messageContent);

        if (!isSent) {
            throw new BusinessException(ErrorCode.SMS_SEND_FAILED);
        }
    }

    // ───────────────────────────────────────────
    // 아이디 찾기 - OTP 인증번호 검증 및 결과 반환
    // ───────────────────────────────────────────
    public FindIdResponse verifyFindIdOtp(FindIdVerifyOtpRequest request) {
        // 1. Redis 기반 매칭 검증
        String savedCode = redisRepository.get("SMS_AUTH:" + request.phone());
        if (savedCode == null) {
            throw new BusinessException(ErrorCode.OTP_EXPIRED);
        }
        if (!savedCode.equals(request.code())) {
            throw new BusinessException(ErrorCode.INVALID_OTP_CODE);
        }

        // 검증 성공 시 즉시 삭제
        redisRepository.delete("SMS_AUTH:" + request.phone());

        // 2. 유저 정보 조회 및 결과 가공
        User user = userRepository.findByNameAndPhone(request.name(), request.phone())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 3. 이메일 마스킹 처리 후 최종 결과 반환
        return new FindIdResponse(maskEmail(user.getEmail()), user.getCreatedAt().toString());
    }

    // ───────────────────────────────────────────
    // 비밀번호 찾기 - 이메일 인증번호 발송
    // ───────────────────────────────────────────
    public void sendFindPwOtp(FindPwSendOtpRequest request) {
        // 1. 유저 검증
        if (!userRepository.existsByEmailAndName(request.email(), request.name())) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

        // 2. 인증코드 생성 및 Redis 저장
        String otpCode = String.format("%06d", SECURE_RANDOM.nextInt(1000000));
        redisRepository.save("EMAIL_AUTH:" + request.email(), otpCode, Duration.ofMinutes(5));

        // 3. HTML 템플릿 빌드 (여기서는 내용만 채웁니다)
        String subject = "[StyleHub] 비밀번호 찾기 인증번호 안내";
        String htmlContent = """
                <div style='margin:20px; padding:20px; border:1px solid #e2e8f0; border-radius:12px; max-width: 500px;'>
                    <h2 style='color: #0F172A; font-size: 20px; margin-bottom: 8px;'>안녕하세요, StyleHub입니다.</h2>
                    <p style='color: #475569; font-size: 14px;'>본인 확인을 위한 비밀번호 찾기 인증번호입니다.<br/>아래의 인증번호를 제한 시간 내에 입력해 주세요.</p>
                    <div style='font-size:32px; font-weight:bold; color:#2563EB; letter-spacing:4px; margin:24px 0; text-align:center; background-color:#F8FAFC; padding:12px; border-radius:8px;'>
                        %s
                    </div>
                    <p style='color: #94A3B8; font-size: 12px; margin-top: 16px;'>※ 인증번호 유효 시간은 <b>5분</b>입니다.</p>
                </div>
                """.formatted(otpCode);

        // 4. 분리한 이메일 공통 서비스 호출!
        emailService.sendHtmlEmail(request.email(), subject, htmlContent);
    }

    // ───────────────────────────────────────────
    // 비밀번호 찾기 - 2단계: 인증번호 검증 및 재설정 토큰 발급
    // ───────────────────────────────────────────
    public ResetPasswordTokenResponse verifyFindPwOtp(FindPwVerifyOtpRequest request) {
        // 1. Redis에서 해당 이메일로 저장된 인증 코드 꺼내기
        String savedCode = redisRepository.get("EMAIL_AUTH:" + request.email());

        // 2. 예외 처리: 만료되었거나 발송된 적이 없는 경우
        if (savedCode == null) {
            throw new BusinessException(ErrorCode.OTP_EXPIRED); // "인증 시간이 만료되었습니다."
        }

        // 3. 예외 처리: 입력한 코드가 틀린 경우
        if (!savedCode.equals(request.code())) {
            throw new BusinessException(ErrorCode.INVALID_OTP_CODE); // "인증번호가 일치하지 않습니다."
        }

        // 4. 보안: 검증 성공 즉시 Redis에 남아있는 1회성 코드는 파기
        redisRepository.delete("EMAIL_AUTH:" + request.email());

        // 5. 1회성 비밀번호 재설정 토큰(JWT) 발행
        // 💡 JwtProvider에 가볍게 이메일을 담아 5~10분짜리 짧은 토큰을 만드는 메서드를 활용합니다.
        String resetToken = jwtProvider.createPasswordResetToken(request.email());

        return new ResetPasswordTokenResponse(resetToken);
    }

    // ───────────────────────────────────────────
    // 비밀번호 찾기 - 3단계: 새 비밀번호로 최종 변경
    // ───────────────────────────────────────────
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        // 1. 프론트가 들고 온 재설정 토큰(JWT) 위변조 및 만료 시간 검증
        if (!jwtProvider.validatePasswordResetToken(request.resetToken())) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }

        // 2. 복호화된 토큰 내부에서 대상 유저의 이메일(클레임) 추출
        String email = jwtProvider.extractEmail(request.resetToken());

        // 3. DB에서 유저 조회
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 4. 새 비밀번호를 해시 암호화(BCrypt)하여 엔티티 데이터 업데이트
        String encodedPassword = passwordEncoder.encode(request.newPassword());
        user.updatePassword(encodedPassword);

        // @Transactional 어노테이션 덕분에 메서드가 정상 종료되면서 DB에 변경 사항이 자동 반영(Dirty Checking)됩니다.
    }

    // ───────────────────────────────────────────
    // 정보 변경을 위한 인증 코드 발송 및 검증 (마이페이지용)
    // ───────────────────────────────────────────
    public void sendChangeAuthCode(String target) {
        String otpCode = String.format("%06d", SECURE_RANDOM.nextInt(1000000));
        saveOtp("CHANGE_AUTH:" + target, otpCode);
    }

    public void verifyChangeAuthCode(String target, String code) {
        validateOtpCode("CHANGE_AUTH:" + target, code);
        redisRepository.save(verificationKey(target), "true", Duration.ofMinutes(10));
        redisRepository.delete("CHANGE_AUTH:" + target);
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

    // 이메일 마스킹 헬퍼
    private String maskEmail(String email) {
        String[] parts = email.split("@");
        String id = parts[0];
        String domain = parts[1];
        if (id.length() <= 3) return id.replaceAll("\\.", "*") + "@" + domain;
        return id.substring(0, 2) + "***" + id.substring(id.length() - 2) + "@" + domain;
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