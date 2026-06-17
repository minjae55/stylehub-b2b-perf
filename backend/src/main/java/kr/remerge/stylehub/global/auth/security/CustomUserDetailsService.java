package kr.remerge.stylehub.global.auth.security;

import kr.remerge.stylehub.domain.user.repository.UserRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
/*
───────────────────────────────────────────
흐름 정리
───────────────────────────────────────────
일반 로그인
AuthService → loadUserByUsername(email)
        → findByEmail() → CustomUserDetails 반환

JWT 요청
JwtFilter → loadUserByUsername(userId)
        → findById() → CustomUserDetails 반환
───────────────────────────────────────────
지금까지 연결 흐름
───────────────────────────────────────────
JwtProperties    # yml 값 로드
    ↓
JwtProvider      # 토큰 생성 / 검증 / 파싱
    ↓
JwtFilter        # 요청마다 토큰 체크 → userId 추출
    ↓
CustomUserDetailsService  # userId로 DB 조회
    ↓
CustomUserDetails         # Security 인증 객체로 변환
    ↓
SecurityContext 저장 → Controller에서 @AuthenticationPrincipal로 사용
*/


// Spring Security가 인증 시 유저 정보를 DB에서 불러오는 클래스
// UserDetailsService : Security가 요구하는 인터페이스, loadUserByUsername() 반드시 구현
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    // ───────────────────────────────────────────
    // 이메일로 유저 로드 (일반 로그인용)
    // ───────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return loadUserByEmail(email);
    }

    // ───────────────────────────────────────────
    // userId로 유저 로드 (JwtFilter에서 호출)
    // ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public UserDetails loadUserByUserId(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "유저를 찾을 수 없습니다. userId: " + userId
                ));

        return new CustomUserDetails(user);
    }

    // ───────────────────────────────────────────
    // 이메일로 유저 로드 (로그인 시 호출)
    // ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public UserDetails loadUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "유저를 찾을 수 없습니다. email: " + email
                ));

        return new CustomUserDetails(user);
    }
}
