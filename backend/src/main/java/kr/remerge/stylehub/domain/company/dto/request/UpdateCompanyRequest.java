package kr.remerge.stylehub.domain.company.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateCompanyRequest(
        @NotBlank(message = "회사명은 필수 입력 항목입니다.")
        String companyName,

        @NotBlank(message = "사업자등록번호는 필수 입력 항목입니다.")
        @Pattern(regexp = "^\\d{10}$", message = "사업자등록번호 형식이 올바르지 않습니다.")
        String businessNumber,

        @NotBlank(message = "대표자명은 필수 입력 항목입니다.")
        String representativeName,

        @NotBlank(message = "대표 연락처는 필수 입력 항목입니다.")
        String representativePhone,

        String websiteUrl,
        String description,

        @NotBlank(message = "회사 주소는 필수 입력 항목입니다.")
        String address,

        @NotBlank(message = "상세 주소는 필수 입력 항목입니다.")
        String addressDetail,

        String logoUrl,
        String businessLicenseUrl
) {
}