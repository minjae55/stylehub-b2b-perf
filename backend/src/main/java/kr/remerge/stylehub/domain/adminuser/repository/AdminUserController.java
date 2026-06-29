package kr.remerge.stylehub.domain.adminuser.repository;


import kr.remerge.stylehub.domain.adminuser.dto.response.AdminUserResponse;
import kr.remerge.stylehub.domain.user.enumtype.UserStatus;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;


import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;
    private final AdminUserService adminUserService;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<AdminUserResponse>>> getAllUsers() {
        List<AdminUserResponse> users = userRepository.findAll().stream()
                .map(AdminUserResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PatchMapping("/{userId}/status")
    public ResponseEntity<?> updateUserStatus(
            @PathVariable("userId") Integer userId,
            @RequestBody Map<String, String> requestBody) {
        UserStatus newStatus = UserStatus.valueOf(requestBody.get("status"));
        adminUserService.changeUserStatus(userId, newStatus);
        return ResponseEntity.ok().body(Map.of("message", "상태 변경 완료"));
    }

}
