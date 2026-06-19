package kr.remerge.stylehub.global.auth.dto;

import kr.remerge.stylehub.global.auth.security.CustomUserDetails;

public record AuthUser(
        Integer userId,
        Integer companyId,
        String role,
        String businessRole
) {
    public static AuthUser from(CustomUserDetails userDetails) {
        return new AuthUser(
                userDetails.getUserId(),
                userDetails.getCompanyId(),
                userDetails.getRole(),
                userDetails.getBusinessRole()
        );
    }
}
