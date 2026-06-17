package kr.remerge.stylehub.domain.user;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import kr.remerge.stylehub.domain.user.dto.request.SignUpRequest;
import kr.remerge.stylehub.domain.user.dto.request.UpdateUserRequest;
import kr.remerge.stylehub.domain.user.dto.response.UserResponse;
import kr.remerge.stylehub.global.response.ApiResponse;
import kr.remerge.stylehub.global.auth.security.CustomUserDetails;

// 유저 관련 API 엔드포인트
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ───────────────────────────────────────────
    // 회원가입
    // ───────────────────────────────────────────

    // POST /api/users/signup
    // 인증 없이 접근 가능 (SecurityConfig에서 permitAll)
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<UserResponse>> signUp(
            @Valid @RequestBody SignUpRequest request) {

        UserResponse response = userService.signUp(request);

        // 201 Created 반환
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    // ───────────────────────────────────────────
    // 내 정보 조회
    // ───────────────────────────────────────────

    // GET /api/users/me
    // JWT 인증 필요
    // @AuthenticationPrincipal : JwtFilter에서 SecurityContext에 저장한 유저 꺼내기
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMe(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        UserResponse response = userService.getMe(userDetails.getUserId());

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ───────────────────────────────────────────
    // 내 정보 수정
    // ───────────────────────────────────────────

    // PATCH /api/users/me
    // JWT 인증 필요
    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateMe(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpdateUserRequest request) {

        UserResponse response = userService.updateMe(userDetails.getUserId(), request);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ───────────────────────────────────────────
    // 회원 탈퇴
    // ───────────────────────────────────────────

    // DELETE /api/users/me
    // JWT 인증 필요
    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> deleteMe(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        userService.deleteMe(userDetails.getUserId());

        return ResponseEntity.ok(ApiResponse.success("회원 탈퇴가 완료되었습니다."));
    }
}