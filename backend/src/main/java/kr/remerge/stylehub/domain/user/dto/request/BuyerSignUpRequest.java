package kr.remerge.stylehub.domain.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.company.enumtype.CompanyStatus;
import kr.remerge.stylehub.domain.company.enumtype.SellerStatus;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.enumtype.BusinessRole;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;
import kr.remerge.stylehub.domain.user.enumtype.UserStatus;

import java.util.List;

public record BuyerSignUpRequest(
        @NotBlank String email,
        @NotBlank @Size(min = 8) String password,
        @NotBlank String name,
        String phone,
        @NotBlank String businessNumber,
        @NotBlank String companyName,
        @NotBlank String representativeName,
        String address,
        String addressDetail,
        String businessLicenseUrl,

        // 유저 개인 선호 카테고리 (3~5개)
        @NotEmpty @Size(min = 3, max = 5)
        List<Integer> preferredCategoryIds
) {
    public Company toCompanyEntity() {
        return Company.builder()
                .name(companyName)
                .businessNumber(businessNumber)
                .representativeName(representativeName)
                .address(address)
                .addressDetail(addressDetail)
                .businessLicenseUrl(businessLicenseUrl)
                .status(CompanyStatus.PENDING)
                .sellerStatus(SellerStatus.NONE)
                .build();
    }

    public User toUserEntity(Company company, String encodedPassword, UserRole userRole, BusinessRole businessRole) {
        return User.builder()
                .company(company)
                .email(email)
                .password(encodedPassword)
                .name(name)
                .phone(phone)
                .role(userRole)
                .businessRole(businessRole)
                .status(UserStatus.PENDING)
                .build();
    }
}
