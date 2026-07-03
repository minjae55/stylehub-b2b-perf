package kr.remerge.stylehub.domain.user.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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

        @NotBlank(message = "사업자등록번호를 입력해주세요.")
        String businessNumber,

        @NotBlank(message = "회사명을 입력해주세요.")
        String companyName,

        @NotBlank(message = "대표자명을 입력해주세요.")
        String representativeName,

        String address,
        String addressDetail,
        String zipCode,
        String representativePhone,

        String businessLicenseUrl,

        @Size(max = 5, message = "선호 카테고리는 5개까지 선택 가능합니다.")
        List<Integer> preferredCategoryIds
) {
    public Company toCompanyEntity() {
        String cleanRepresentativePhone = this.representativePhone.replaceAll("[^0-9]", "");
        return Company.builder()
                .name(companyName)
                .businessNumber(businessNumber)
                .representativeName(representativeName)
                .representativePhone(cleanRepresentativePhone)
                .address(address)
                .addressDetail(addressDetail)
                .businessLicenseUrl(businessLicenseUrl)
                .status(CompanyStatus.PENDING)
                .sellerStatus(SellerStatus.NONE)
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
}