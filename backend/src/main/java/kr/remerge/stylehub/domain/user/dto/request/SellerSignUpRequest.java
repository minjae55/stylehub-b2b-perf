package kr.remerge.stylehub.domain.user.dto.request;

import jakarta.validation.constraints.*;
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
        // ─── 계정 정보 ───
        @Email(message = "올바른 이메일 형식이 아닙니다.")
        @NotBlank(message = "이메일은 필수 입력 항목입니다.")
        String email,

        @NotBlank(message = "비밀번호는 필수 입력 항목입니다.")
        @Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다.")
        String password,

        @NotBlank(message = "이름을 입력해주세요.")
        String name,

        String phone,

        // ─── 사업자 정보 ───
        @NotBlank(message = "사업자등록번호를 입력해주세요.")
        String businessNumber,

        @NotBlank(message = "회사명을 입력해주세요.")
        String companyName,

        @NotBlank(message = "대표자명을 입력해주세요.")
        String representativeName,

        String address,
        String addressDetail,

        @NotBlank(message = "사업자등록증 이미지를 업로드해주세요.")
        String businessLicenseUrl,

        // ─── 매장 정보 ───
        String brandName,
        String websiteUrl,

        @NotNull(message = "매장 타입을 선택해주세요.")
        CompanyStoreType storeType,

        // ─── 정산 계좌 정보 ───
        @NotBlank(message = "은행을 선택해주세요.")
        String bankName,

        @NotBlank(message = "계좌번호를 입력해주세요.")
        String accountNumber,

        @NotBlank(message = "예금주명을 입력해주세요.")
        String accountHolder,

        // ─── 카테고리 정보 ───
        @NotEmpty(message = "선호 카테고리를 선택해주세요.")
        @Size(min = 3, max = 5, message = "선호 카테고리는 3개에서 5개까지 선택 가능합니다.")
        List<Integer> preferredCategoryIds,

        @NotEmpty(message = "취급 카테고리를 선택해주세요.")
        @Size(min = 3, max = 5, message = "취급 카테고리는 3개에서 5개까지 선택 가능합니다.")
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
