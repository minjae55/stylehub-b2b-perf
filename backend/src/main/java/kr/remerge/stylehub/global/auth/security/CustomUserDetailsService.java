package kr.remerge.stylehub.global.auth.security;

import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
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
일반 로그인 (AuthService)
    → loadUserByUsername(email) → findByEmail() → CustomUserDetails 반환

JWT 요청 (JwtFilter)
    → loadUserByUserId(userId) → findById() → CustomUserDetails 반환
*/

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    // ───────────────────────────────────────────
    // Spring Security 표준 인터페이스 - 로그인(email) 전용
    // AuthService.login()에서 AuthenticationManager를 통해 호출됨
    // ───────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "유저를 찾을 수 없습니다. email: " + email
                ));
        return new CustomUserDetails(user);
    }

    // ───────────────────────────────────────────
    // JWT 필터 전용 - userId로 직접 조회 (Spring 표준 메서드 아님)
    // JwtFilter에서 토큰의 userId로 조회할 때 호출됨
    // ───────────────────────────────────────────
    @Transactional(readOnly = true)
    public UserDetails loadUserByUserId(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "유저를 찾을 수 없습니다. userId: " + userId
                ));
        return new CustomUserDetails(user);
    }
}