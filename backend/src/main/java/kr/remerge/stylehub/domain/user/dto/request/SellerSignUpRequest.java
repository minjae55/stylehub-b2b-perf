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
        // 계정 정보
        @NotBlank(message = "이메일은 필수 입력 항목입니다.")
        @Email(message = "올바른 이메일 형식이 아닙니다.")
        String email,

        @NotBlank(message = "비밀번호는 필수 입력 항목입니다.")
        @Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다.")
        String password,

        @NotBlank(message = "이름은 필수 입력 항목입니다.")
        @Pattern(
                regexp = "^([가-힣]{1,5}|[a-zA-Z\\s]{2,20})$",
                message = "이름은 한글 1~5자 또는 영문 2~20자(공백 포함)로 입력해 주세요."
        )
        String name,

        @NotBlank(message = "휴대폰 번호는 필수 입력 항목입니다.")
        @Pattern(
                regexp = "^01(?:0|1|[6-9])(?:\\d{3}|\\d{4})\\d{4}$",
                message = "올바른 휴대폰 번호 형식이 아닙니다. 숫자만 입력해 주세요."
        )
        String phone,

        // 사업자 정보
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

        // 매장 정보
        String brandName,
        String zipCode,
        String websiteUrl,
        String representativePhone,

        @NotNull(message = "매장 타입을 선택해주세요.")
        CompanyStoreType storeType,

        // 정산 계좌 정보
        @NotBlank(message = "은행을 선택해주세요.")
        String bankName,

        @NotBlank(message = "계좌번호를 입력해주세요.")
        String accountNumber,

        @NotBlank(message = "예금주명을 입력해주세요.")
        String accountHolder,

        // 카테고리 정보
        @Size(max = 5, message = "선호 카테고리는 5개까지 선택 가능합니다.")
        List<Integer> preferredCategoryIds,

        @NotEmpty(message = "취급 카테고리를 선택해주세요.")
        @Size(min = 1, max = 5, message = "취급 카테고리는 최소 1개에서 5개까지 선택 가능합니다.")
        List<Integer> handledCategoryIds
) {
    public Company toCompanyEntity() {
        String cleanRepresentativePhone = this.phone.replaceAll("[^0-9]", "");
        return Company.builder()
                .name(companyName)
                .businessNumber(businessNumber)
                .representativeName(representativeName)
                .representativePhone(cleanRepresentativePhone)
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
        String cleanPhone = this.phone.replaceAll("[^0-9]", "");
        return User.builder()
                .company(company)
                .email(email)
                .password(encodedPassword)
                .name(name)
                .phone(cleanPhone)
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