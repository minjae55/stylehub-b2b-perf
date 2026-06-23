package kr.remerge.stylehub.domain.adminuser.dto.response;

import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.enumtype.BusinessRole;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;
import kr.remerge.stylehub.domain.user.enumtype.UserStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Builder
public class AdminUserResponse {
    private Integer userId;
    private String name;
    private String email;
    private String companyName;
    private UserRole role;
    private BusinessRole businessRole;
    private UserStatus status;
    private LocalDateTime createdAt;

    public static AdminUserResponse from(User user) {
        return AdminUserResponse.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .companyName(user.getCompany() != null ? user.getCompany().getName() : null)
                .role(user.getRole())
                .businessRole(user.getBusinessRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
