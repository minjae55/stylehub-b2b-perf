package kr.remerge.stylehub.global.auth;

import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import kr.remerge.stylehub.global.auth.dto.LoginRequest;
import kr.remerge.stylehub.global.auth.dto.TokenResponse;
import kr.remerge.stylehub.global.auth.jwt.JwtProvider;
import kr.remerge.stylehub.global.auth.security.CustomUserDetails;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
/*
흐름 요약
로그인 요청
    → 유저 조회 → 상태 체크 → 실패 횟수 체크
    → AuthenticationManager로 비밀번호 검증
    → 성공 : 로그인 정보 업데이트 → JWT 발급
    → 실패 : 실패 횟수 증가 → 예외 던지기

토큰 재발급
    → 리프레시 토큰 만료 확인
    → userId 추출 → 유저 조회 → 상태 체크
    → 새 액세스 토큰 발급
*/

// 로그인, 로그아웃, 토큰 재발급 등 인증 관련 비즈니스 로직 담당
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // ───────────────────────────────────────────
    // 일반 로그인
    // ───────────────────────────────────────────

    @Transactional
    public TokenResponse login(LoginRequest request, String clientIp) {

        // 1. 이메일로 유저 조회
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 2. 계정 상태 체크
        validateUserStatus(user);
        boolean result = passwordEncoder.matches(request.password(), user.getPassword());
        // 3. 로그인 실패 횟수 체크
        if (user.getFailedLoginAttempts() >= 5) {
            throw new BusinessException(ErrorCode.LOGIN_ATTEMPTS_EXCEEDED);
        }
        //───────────────────────────────────────────
        System.out.println("=================================================");
        System.out.println("👉 내 서버가 만든 '1'의 해시값: " + passwordEncoder.encode("1"));
        System.out.println("[백엔드] 1. 유저가 입력한 날것의 암호: " + request.password());
        System.out.println("[백엔드] 2. 현재 DB에 저장된 해시값: " + user.getPassword());

        boolean isMatch = passwordEncoder.matches(request.password(), user.getPassword());
        System.out.println("[백엔드] 3. BCrypt 매치 결과 (일치여부): " + isMatch);
        System.out.println("=================================================");
        // ───────────────────────────────────────────────────────────────
        // 4. 비밀번호 검증
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            user.onLoginFailed();
            throw new BusinessException(ErrorCode.INVALID_PASSWORD);
        }

        // 5. 인증 성공 처리
        user.onLoginSuccess(clientIp);

        // 6. SecurityContext 등록 (필요 시)
        CustomUserDetails userDetails = new CustomUserDetails(user);
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 7. JWT 발급 (이 부분을 꼭 추가하세요!)
        String accessToken = jwtProvider.generateAccessToken(
                user.getUserId(),
                user.getCompany().getCompanyId(),
                user.getRole().name(),
                user.getBusinessRole().name()
        );
        String refreshToken = jwtProvider.generateRefreshToken(user.getUserId());
        return TokenResponse.of(accessToken, refreshToken);
    }

    // ───────────────────────────────────────────
    // 액세스 토큰 재발급
    // ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public TokenResponse refresh(String refreshToken) {

        // 1. 리프레시 토큰 만료 여부 확인
        if (jwtProvider.isExpired(refreshToken)) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        // 2. 리프레시 토큰에서 userId 추출
        Integer userId = jwtProvider.getUserId(refreshToken);

        // 3. DB에서 유저 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 4. 계정 상태 재확인
        validateUserStatus(user);

        // 5. 새 액세스 토큰 발급
        //    리프레시 토큰은 그대로 유지
        String newAccessToken = jwtProvider.generateAccessToken(
                user.getUserId(),
                user.getCompany().getCompanyId(),
                user.getRole().name(),
                user.getBusinessRole().name());

        return TokenResponse.of(newAccessToken, refreshToken);
    }

    // ───────────────────────────────────────────
    // 계정 상태 검증 (내부 공통 메서드)
    // ───────────────────────────────────────────

    private void validateUserStatus(User user) {
        switch (user.getStatus()) {
            case PENDING ->
                    throw new BusinessException(ErrorCode.USER_PENDING);
            case SUSPENDED ->
                    throw new BusinessException(ErrorCode.USER_SUSPENDED);
            case DELETED ->
                    throw new BusinessException(ErrorCode.USER_DELETED);
            default -> {} // APPROVED → 통과
        }
    }

}
