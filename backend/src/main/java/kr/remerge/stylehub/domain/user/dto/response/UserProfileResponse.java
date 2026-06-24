package kr.remerge.stylehub.domain.user.dto.response;

import kr.remerge.stylehub.domain.user.entity.User;

public record UserProfileResponse(
    String email,
    String name,
    String phone,
    String companyName,
    String profileImageUrl,
    String role,
    String businessRole
) {
    // Entity를 DTO로 변환하는 정적 팩토리 메서드
    public static UserProfileResponse from(User user) {
        return new UserProfileResponse(
            user.getEmail(),
            user.getName(),
            user.getPhone(),
            user.getCompany().getName(),
            user.getProfileImageUrl(),
            user.getRole().name(),
            user.getBusinessRole().name()
        );
    }
}