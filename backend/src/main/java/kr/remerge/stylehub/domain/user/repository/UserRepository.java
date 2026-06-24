package kr.remerge.stylehub.domain.user.repository;

import kr.remerge.stylehub.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {

    // 이메일로 유저 조회 (로그인, 중복 체크 등에서 사용)
    Optional<User> findByEmail(String email);

    // 이메일 중복 체크 (회원가입 시 사용)
    boolean existsByEmail(String email);

    // User를 가져올 때 Company까지 한 번에 로딩
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.company WHERE u.userId = :userId")
    Optional<User> findByIdWithCompany(@Param("userId") Integer userId);

    // ───────────────────────────────────────────
    // 아이디 / 비밀번호 찾기
    // ───────────────────────────────────────────

    /**
     * 1. 이름과 휴대폰 번호로 유저가 존재하는지 여부 확인 (아이디 찾기 검증용)
     */
    boolean existsByNameAndPhone(String name, String phone);

    /**
     * 2. 이름과 휴대폰 번호로 유저 엔티티 단건 조회 (아이디 찾기 마스킹용)
     */
    Optional<User> findByNameAndPhone(String name, String phone);

    /**
     * 3. 가입 이메일과 이름으로 유저 엔티티 단건 조회 (비밀번호 재설정 링크 발송용)
     */
    Optional<User> findByEmailAndName(String email, String name);
}