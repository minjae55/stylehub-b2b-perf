// UserResponse.java
package kr.remerge.stylehub.domain.user.dto.response;

import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.company.enumtype.CompanyStatus;
import kr.remerge.stylehub.domain.company.enumtype.CompanyStoreType;
import kr.remerge.stylehub.domain.company.enumtype.SellerStatus;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.enumtype.BusinessRole;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;
import kr.remerge.stylehub.domain.user.enumtype.UserStatus;
import lombok.Builder;

import java.time.LocalDateTime;

// 유저 정보 응답 DTO
// Entity를 직접 반환하지 않고 필요한 필드만 골라서 반환
@Builder
public record UserResponse(
        Integer userId,
        Integer companyId,
        String companyName,
        CompanyStatus companyStatus,
        SellerStatus sellerStatus,
        CompanyStoreType storeType,
        String logoUrl,
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
        Company company = user.getCompany();

        return UserResponse.builder()
                .userId(user.getUserId())
                .companyId(company != null ? company.getCompanyId() : null)
                .companyName(company != null ? company.getName() : null)
                .companyStatus(company != null ? company.getStatus() : null)
                .sellerStatus(company != null ? company.getSellerStatus() : SellerStatus.NONE)
                .storeType(company != null ? company.getStoreType() : null)
                .logoUrl(company != null ? company.getLogoUrl() : null)
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