package kr.remerge.stylehub.domain.adminuser.repository;

import kr.remerge.stylehub.domain.adminuser.dto.response.AdminUserResponse;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminUserResponse>>> getAllUsers() {
        List<AdminUserResponse> users = userRepository.findAll().stream()
                .map(AdminUserResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(users));
    }
}
