package kr.remerge.stylehub.global.auth.security;

import kr.remerge.stylehub.domain.user.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

// Spring Security가 인증/인가에 사용하는 유저 정보 그릇
// UserDetails : Security가 요구하는 인터페이스, 반드시 구현해야 함
@Getter
public class CustomUserDetails implements UserDetails {

    // ───────────────────────────────────────────
    // 필드
    // ───────────────────────────────────────────

    // DB의 users 테이블에서 가져온 정보들
    private final Integer userId;
    private final String email;
    private final String password;
    private final String role;          // ADMIN / PRESIDENT / EMPLOYEE
    private final String businessRole;  // BUYER / SELLER / BOTH
    private final String status;        // PENDING / APPROVED / SUSPENDED / DELETED

    // ───────────────────────────────────────────
    // 생성자 (User 엔티티 → CustomUserDetails 변환)
    // ───────────────────────────────────────────

    // User 엔티티를 받아서 필요한 필드만 꺼내 저장
    // 엔티티 전체를 들고 다니지 않고 필요한 값만 복사하는 게 포인트
    public CustomUserDetails(User user) {
        this.userId = user.getUserId();
        this.email = user.getEmail();
        this.password = user.getPassword();
        this.role = user.getRole().name();
        this.businessRole = user.getBusinessRole().name();
        this.status = user.getStatus().name();
    }

    // ───────────────────────────────────────────
    // UserDetails 인터페이스 구현 (필수)
    // ───────────────────────────────────────────

    // 권한 목록 반환
    // Spring Security의 @PreAuthorize, hasRole() 등에서 사용됨
    // "ROLE_" prefix를 붙여야 hasRole('ADMIN') 같은 표현이 동작함
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(
                new SimpleGrantedAuthority("ROLE_" + role),
                new SimpleGrantedAuthority("ROLE_" + businessRole)
        );
    }

    // 비밀번호 반환 (Security 내부에서 사용)
    @Override
    public String getPassword() {
        return password;
    }

    // Security에서 유저를 식별하는 고유값
    // 우리는 email을 식별자로 사용
    @Override
    public String getUsername() {
        return email;
    }

    // ───────────────────────────────────────────
    // 계정 상태 체크 (UserDetails 인터페이스 필수 구현)
    // ───────────────────────────────────────────

    // 계정 만료 여부 (true = 만료 안됨)
    // 우리는 status로 관리하므로 항상 true 반환
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    // 계정 잠금 여부 (true = 잠기지 않음)
    // SUSPENDED 상태면 잠긴 것으로 처리
    @Override
    public boolean isAccountNonLocked() {
        return !status.equals("SUSPENDED");
    }

    // 자격증명(비밀번호) 만료 여부 (true = 만료 안됨)
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    // 계정 활성화 여부 (true = 활성화)
    // APPROVED 상태인 유저만 활성화로 처리
    // PENDING, DELETED 상태면 false → Security가 자동으로 접근 차단
    @Override
    public boolean isEnabled() {
        return status.equals("APPROVED");
    }
}
