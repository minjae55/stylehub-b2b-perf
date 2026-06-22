package kr.remerge.stylehub.domain.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import kr.remerge.stylehub.domain.company.entity.Brand;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.company.entity.CompanyBankAccount;
import kr.remerge.stylehub.domain.company.enumtype.CompanyStatus;
import kr.remerge.stylehub.domain.company.enumtype.CompanyStoreType;
import kr.remerge.stylehub.domain.company.enumtype.SellerStatus;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.enumtype.BusinessRole;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;
import kr.remerge.stylehub.domain.user.enumtype.UserStatus;

import java.util.List;

public record SellerSignUpRequest(
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
        String websiteUrl,
        CompanyStoreType storeType,
        String brandName,
        @NotBlank String bankName,
        @NotBlank String accountNumber,
        @NotBlank String accountHolder,

        // 유저 개인 선호 카테고리 (3~5개)
        @NotEmpty @Size(min = 3, max = 5)
        List<Integer> preferredCategoryIds,

        // 회사 취급 카테고리 (셀러만, 3~5개)
        @NotEmpty @Size(min = 3, max = 5)
        List<Integer> handledCategoryIds
) {
    public Company toCompanyEntity() {
        return Company.builder()
                .name(companyName)
                .businessNumber(businessNumber)
                .representativeName(representativeName)
                .address(address)
                .addressDetail(addressDetail)
                .businessLicenseUrl(businessLicenseUrl)
                .websiteUrl(websiteUrl)
                .storeType(storeType)
                .status(CompanyStatus.PENDING)
                .sellerStatus(SellerStatus.PENDING)
                .build();
    }

    public Brand toBrandEntity(Company company) {
        return Brand.builder()
                .company(company)
                .brandName(brandName)
                .build();
    }

    public User toUserEntity(Company company, String encodedPassword) {
        return User.builder()
                .company(company)
                .email(email)
                .password(encodedPassword)
                .name(name)
                .phone(phone)
                .role(UserRole.PRESIDENT)
                .businessRole(BusinessRole.SELLER)
                .status(UserStatus.PENDING)
                .build();
    }

    public CompanyBankAccount toBankAccountEntity(Company company) {
        return CompanyBankAccount.builder()
                .company(company)
                .bankName(bankName)
                .accountNumber(accountNumber)
                .accountHolder(accountHolder)
                .isDefault(true)
                .build();
    }
}
