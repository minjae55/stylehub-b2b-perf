package kr.remerge.stylehub.domain.company.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.enumtype.BusinessRole;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record EmployeeResponse(
        Integer userId,
        String name,
        String email,
        String phone,
        UserRole role,
        BusinessRole businessRole,
        String status, // PENDING, APPROVED, SUSPENDED 등
        String profileImageUrl,
        LocalDateTime lastLoginAt,
        LocalDateTime createdAt
) {
    public static EmployeeResponse from(User user) {
        return new EmployeeResponse(
                user.getUserId(), user.getName(), user.getEmail(), user.getPhone(),
                user.getRole(), user.getBusinessRole(),
                user.getStatus() != null ? user.getStatus().name() : "PENDING",
                user.getProfileImageUrl(), user.getLastLoginAt(), user.getCreatedAt()
        );
    }

    public static EmployeeResponse ofSimple(User user) {
        return new EmployeeResponse(
                user.getUserId(),
                user.getName(),
                null, null, null, null, null, null, null, null // 나머지는 다 null
        );
    }
}