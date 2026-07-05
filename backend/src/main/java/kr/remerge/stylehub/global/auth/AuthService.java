package kr.remerge.stylehub.global.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import kr.remerge.stylehub.global.auth.dto.find.*;
import kr.remerge.stylehub.global.auth.dto.login.LoginRequest;
import kr.remerge.stylehub.global.auth.dto.token.TokenResponse;
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
    // 로그인
    // ───────────────────────────────────────────
    @Transactional
    public TokenResponse login(LoginRequest request, String clientIp) {
        // 1. 이메일로 사용자 조회 (없으면 바로 로그인 실패 에러)
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_LOGIN_CREDENTIALS));


        // 2. 계정 잠금 여부 먼저 체크 (비밀번호 검사 전 5회 실패 차단)
        if (user.getFailedLoginAttempts() >= 5) {
            throw new BusinessException(ErrorCode.LOGIN_ATTEMPTS_EXCEEDED);
        }

        // 3. 비밀번호 일치 여부 '먼저' 검사
        boolean passwordMatched = passwordEncoder.matches(request.password(), user.getPassword());

        if (!passwordMatched) {
            user.onLoginFailed();
            throw new BusinessException(ErrorCode.INVALID_LOGIN_CREDENTIALS);
        }

        validateCompanyStatus(user);
        validateUserStatus(user);

        String accessToken = jwtProvider.generateAccessToken(user.getUserId(), user.getCompany().getCompanyId(), user.getRole().name(), user.getBusinessRole().name());
        String refreshToken = jwtProvider.generateRefreshToken(user.getUserId());

        redisRepository.save(
                refreshTokenKey(user.getUserId()),
                refreshToken,
                Duration.ofMillis(jwtProperties.getRefreshTokenExpiration())
        );
        user.onLoginSuccess(clientIp);
        return TokenResponse.of(accessToken, refreshToken);
    }

    // ───────────────────────────────────────────
    // JWT 필터 전용 - userId로 직접 조회 (Spring 표준 메서드 아님)
    // JwtFilter에서 토큰의 userId로 조회할 때 호출됨
    // ───────────────────────────────────────────
//    @Transactional(readOnly = true)
//    public UserDetails loadUserByUserId(Integer userId) {
//        User user = userRepository.findById(userId)
//                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
//        return new CustomUserDetails(user);
//    }

    // ───────────────────────────────────────────
    // 액세스 토큰 재발급 (Refresh)
    // ───────────────────────────────────────────
    @Transactional(readOnly = true)
    public TokenResponse refresh(String refreshToken) {
        try {
            Claims claims = jwtProvider.parseClaims(refreshToken);

            Integer userId = Integer.parseInt(claims.getSubject());

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
                    user.getBusinessRole().name()
            );

            return TokenResponse.of(newAccessToken, refreshToken);

        } catch (JwtException | IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }
    }


    private void validateUserStatus(User user) {
        switch (user.getStatus()) {
            case PENDING -> throw new BusinessException(ErrorCode.USER_PENDING);
            case SUSPENDED -> throw new BusinessException(ErrorCode.USER_SUSPENDED);
            case DELETED -> throw new BusinessException(ErrorCode.USER_DELETED);
            default -> {
            }
        }
    }

    private void validateCompanyStatus(User user) {
        // 유저에게 회사가 할당되어 있지 않은 예외 상황 방어 (ex: 최고 관리자 등)
        if (user.getCompany() == null) {
            return;
        }

        switch (user.getCompany().getStatus()) {
            case PENDING -> throw new BusinessException(ErrorCode.COMPANY_PENDING);   // "승인 대기 중인 회사입니다."
            case SUSPENDED -> throw new BusinessException(ErrorCode.COMPANY_SUSPENDED); // "이용 정지된 회사입니다."
            case DELETED -> throw new BusinessException(ErrorCode.COMPANY_DELETED);   // "삭제된 회사 정보입니다."
            default -> {
                // APPROVED(정상) 상태일 때는 통과
            }
        }
    }

    // ───────────────────────────────────────────
    // 회원가입 (SignUp) 비즈니스 로직 추가
    // ───────────────────────────────────────────

    /**
     * 회원가입용 이메일 중복체크
     * 이미 가입된 유저가 존재하면 DUPLICATE_EMAIL(409) 에러 발생
     */
    public void checkEmailDuplicateForSignUp(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }
    }

    /**
     * 회원가입용 휴대폰 번호 중복체크
     * 이미 가입된 휴대폰 번호가 존재하면 DUPLICATE_PHONE_NUMBER(409) 에러 발생
     */
    public void checkPhoneDuplicateForSignUp(String phone) {
        String cleanPhone = phone.replaceAll("[^0-9]", "");
        if (userRepository.existsByPhone(cleanPhone)) {
            throw new BusinessException(ErrorCode.DUPLICATE_PHONE_NUMBER);
        }
    }

    /**
     * 회원가입용 이메일 OTP 발송
     */
    public void sendSignUpEmailOtp(String email) {
        // 1. 중복 체크
        checkEmailDuplicateForSignUp(email);

        // 2. 인증코드 생성 및 Redis 저장
        String otpCode = String.format("%06d", SECURE_RANDOM.nextInt(1000000));
        String targetKey = "SIGNUP:EMAIL:" + email;
        redisRepository.save(targetKey, otpCode, Duration.ofMinutes(3));

        // 3. EmailService에 정의한 순서(email, otpCode)대로 전달
        emailService.sendSignUpVerificationEmail(email, otpCode);
    }

    /**
     * 회원가입용 이메일 OTP 검증 및 점유 성공 플래그 저장
     */
    public void verifySignUpEmailOtp(String email, String code) {
        String targetKey = "SIGNUP:EMAIL:" + email;
        validateOtpCode(targetKey, code); // 만료 및 불일치 자동 체크 예외처리됨

        // 검증 성공 시 가입 완료용 인증 완료 플래그 활성화 (10분 간 유효)
        redisRepository.save(verificationKey(email), "true", Duration.ofMinutes(10));
        redisRepository.delete(targetKey); // 사용된 OTP 폐기
    }

    /**
     * 회원가입용 휴대폰 OTP 발송
     */
    public void sendSignUpPhoneOtp(String phone) {

        checkPhoneDuplicateForSignUp(phone);

        String cleanPhone = phone.replaceAll("[^0-9]", "");
        String otpCode = "01000000000".equals(cleanPhone) ? "123456" : String.format("%06d", SECURE_RANDOM.nextInt(1000000));
        String targetKey = "SIGNUP:PHONE:" + cleanPhone;

        redisRepository.save(targetKey, otpCode, Duration.ofMinutes(3));
        smsService.sendSignUpOtpSms(phone, otpCode);
    }

    /**
     * 회원가입용 휴대폰 OTP 검증 및 점유 성공 플래그 저장
     */
    public void verifySignUpPhoneOtp(String phone, String code) {
        String cleanPhone = phone.replaceAll("[^0-9]", "");
        String targetKey = "SIGNUP:PHONE:" + cleanPhone;
        validateOtpCode(targetKey, code);

        // 검증 성공 시 가입 완료용 인증 완료 플래그 활성화 (10분 간 유효)
        redisRepository.save(verificationKey(phone), "true", Duration.ofMinutes(10));
        redisRepository.delete(targetKey); // 사용된 OTP 폐기
    }

    // ───────────────────────────────────────────
    // 로그아웃 (Logout)
    // ───────────────────────────────────────────
    public void logout(Integer userId) {
        redisRepository.delete(refreshTokenKey(userId));
    }

    // ───────────────────────────────────────────
    // 아이디 찾기 - OTP 인증번호 발송
    // ───────────────────────────────────────────
    public void sendFindIdOtp(FindIdSendOtpRequest request) {
        // 1. 유저 존재 여부 확인 (UserRepository 바로 활용)
        if (!userRepository.existsByNameAndPhone(request.name(), request.phone())) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

        String cleanPhone = request.phone().replaceAll("[^0-9]", "");
        // 2. 난수 생성 및 Redis 저장
        String otpCode = "01000000000".equals(cleanPhone) ? "123456" : String.format("%06d", SECURE_RANDOM.nextInt(1000000));
        redisRepository.save("SMS_AUTH:" + request.phone(), otpCode, Duration.ofMinutes(3));

        // 3. 문자 발송
        boolean isSent = smsService.sendFindIdOtpSms(request.phone(), otpCode);

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

        // 2. 인증코드 생성 및 Redis 저장 (비밀번호 찾기는 정책상 5분)
        String otpCode = String.format("%06d", SECURE_RANDOM.nextInt(1000000));
        redisRepository.save("EMAIL_AUTH:" + request.email(), otpCode, Duration.ofMinutes(5));

        // 3. 전용 서비스 메서드를 호출하여 코드만 전달! (내부에서 문구 조립 및 발송 일괄 처리)
        emailService.sendFindPasswordEmail(request.email(), otpCode);
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
        // JwtProvider에 가볍게 이메일을 담아 5~10분짜리 짧은 토큰을 만드는 메서드를 활용합니다.
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
    public void sendChangeIdOtp(String newEmail) {
        // 1. 중복 체크: 바꾸려는 이메일이 이미 시스템에 가입된 이메일인지 검증
        if (userRepository.existsByEmail(newEmail)) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }
        // 2. 6자리 인증 코드 생성
        String otpCode = String.format("%06d", SECURE_RANDOM.nextInt(1000000));

        // 3. Redis 저장 (기존에 정의된 CHANGE_AUTH 키 접두사 및 saveOtp 헬퍼 활용)
        String targetKey = "CHANGE_AUTH:EMAIL:" + newEmail;
        saveOtp(targetKey, otpCode, Duration.ofMinutes(5));

        // 4. 이메일 발송 서비스 호출 (문구는 마이페이지 이메일 변경용 전용 메서드가 있다면 그것으로 교체 가능)
        emailService.sendSignUpVerificationEmail(newEmail, otpCode);// 내부적으로 Duration.ofMinutes(3) 적용됨
    }

    public void verifyChangeIdOtp(String newEmail, String otpCode) {
        String targetKey = "CHANGE_AUTH:EMAIL:" + newEmail;

        // 1. 공통 헬퍼 메서드로 만료 및 일치 여부 검증 (틀리면 예외 발생)
        validateOtpCode(targetKey, otpCode);

        // 2. 검증 성공 시, 최종 프로필 업데이트(수정) 단계에서 확인할 '인증 완료 플래그' 저장 (10분 유효)
        redisRepository.save(verificationKey(newEmail), "true", Duration.ofMinutes(10));

        // 3. 사용 완료된 OTP 소멸
        redisRepository.delete(targetKey);
    }

    public void sendChangePhoneOtp(String newPhone) {
        // 1. 하이픈 등 특수문자 제거 전처리
        String cleanPhone = newPhone.replaceAll("[^0-9]", "");

        // 2. 중복 체크: 바꾸려는 번호가 이미 다른 유저가 사용 중인 번호인지 검증
        if (userRepository.existsByPhone(cleanPhone)) {
            throw new BusinessException(ErrorCode.DUPLICATE_PHONE_NUMBER);
        }

        // 3. 테스트용 계정 예외 처리 및 6자리 인증 코드 생성
        String otpCode = "01000000000".equals(cleanPhone) ? "123456" : String.format("%06d", SECURE_RANDOM.nextInt(1000000));

        // 4. Redis 저장 (휴대폰 전용 접두사 'CHANGE_AUTH:PHONE:' 사용, 5분 유효)
        String targetKey = "CHANGE_AUTH:PHONE:" + cleanPhone;
        saveOtp(targetKey, otpCode, Duration.ofMinutes(5));

        // 5. 알림톡/SMS 발송 서비스 호출 (가입 시 쓰던 템플릿 혹은 전용 마이페이지 템플릿 사용)
        smsService.sendSignUpOtpSms(newPhone, otpCode);
    }

    public void verifyChangePhoneOtp(String newPhone, String otpCode) {
        // 1. 하이픈 제거 전처리
        String cleanPhone = newPhone.replaceAll("[^0-9]", "");
        String targetKey = "CHANGE_AUTH:PHONE:" + cleanPhone;

        // 2. 공통 헬퍼 메서드로 만료 및 일치 여부 검증 (틀리면 예외 발생)
        validateOtpCode(targetKey, otpCode);

        // 3. 검증 성공 시, 최종 프로필 업데이트 단계에서 대조할 '인증 완료 플래그' 저장 (10분 유효)
        redisRepository.save(verificationKey(cleanPhone), "true", Duration.ofMinutes(10));

        // 4. 사용 완료된 OTP 소멸
        redisRepository.delete(targetKey);
    }

    // ───────────────────────────────────────────
    // 회원정보 수정 시 '이메일 인증 여부' 검증 정책
    // ───────────────────────────────────────────
    public boolean isVerified(String target) {
        String authStatus = redisRepository.get(verificationKey(target));
        return "true".equals(authStatus);
    }

    public void validateVerification(String target) {
        if (!isVerified(target)) {
            throw new BusinessException(ErrorCode.UNVERIFIED_EMAIL);
        }
        invalidateVerification(target);
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

    private void saveOtp(String target, String code, Duration duration) {
        redisRepository.save(target, code, duration);
    }

    private String verificationKey(String target) {
        return "VERIFIED:" + target;
    }

    private String refreshTokenKey(Integer userId) {
        return "REFRESH_TOKEN:" + userId;
    }
}