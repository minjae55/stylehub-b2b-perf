// UserResponse.java
package kr.remerge.stylehub.domain.user.dto.response;

import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.enumtype.BusinessRole;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;
import kr.remerge.stylehub.domain.user.enumtype.UserStatus;
import lombok.Builder;
import lombok.extern.jackson.Jacksonized;

import java.time.LocalDateTime;

// 유저 정보 응답 DTO
// Entity를 직접 반환하지 않고 필요한 필드만 골라서 반환
@Builder
public record UserResponse(
        Integer userId,
        String email,
        String name,
        String phone,
        UserRole role,
        BusinessRole businessRole,
        String profileImageUrl,
        UserStatus status,
        LocalDateTime createdAt
) {
    // Entity → DTO 변환
    public static UserResponse from(User user) {
        return UserResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .name(user.getName())
                .phone(user.getPhone())
                .role(user.getRole())
                .businessRole(user.getBusinessRole())
                .profileImageUrl(user.getProfileImageUrl())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }
}