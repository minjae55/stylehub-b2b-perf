package kr.remerge.stylehub.domain.user;

import kr.remerge.stylehub.domain.user.dto.request.UpdateUserRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import kr.remerge.stylehub.domain.user.dto.request.SignUpRequest;
import kr.remerge.stylehub.domain.user.dto.response.UserResponse;
import kr.remerge.stylehub.domain.user.enumtype.UserStatus;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // ───────────────────────────────────────────
    // 회원가입
    // ───────────────────────────────────────────

    @Transactional
    public UserResponse signUp(SignUpRequest request) {

        // 1. 이메일 중복 체크
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }

        // 2. 비밀번호 암호화
        // BCrypt로 단방향 암호화 → DB에 평문 저장 절대 금지
        String encodedPassword = passwordEncoder.encode(request.password());

        // 3. User 엔티티 생성
        // 가입 직후엔 PENDING 상태 (관리자 승인 후 APPROVED)
        User user = User.builder()
                .email(request.email())
                .password(encodedPassword)
                .name(request.name())
                .phone(request.phone())
                .role(request.role())
                .businessRole(request.businessRole())
                .status(UserStatus.PENDING)
                .build();

        // 4. DB 저장
        User savedUser = userRepository.save(user);

        // 5. 저장된 유저 정보 반환
        return UserResponse.from(savedUser);
    }

    // ───────────────────────────────────────────
    // 내 정보 조회
    // ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public UserResponse getMe(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        return UserResponse.from(user);
    }

    // ───────────────────────────────────────────
    // 내 정보 수정
    // ───────────────────────────────────────────

    @Transactional
    public UserResponse updateMe(Integer userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        user.update(request.name(), request.phone(), request.profileImageUrl());

        return UserResponse.from(user);
    }

    // ───────────────────────────────────────────
    // 회원 탈퇴
    // ───────────────────────────────────────────

    @Transactional
    public void deleteMe(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        user.delete();
    }
}