package kr.remerge.stylehub.domain.address.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import kr.remerge.stylehub.domain.address.Address;
import kr.remerge.stylehub.domain.company.entity.Company;

public record AddressSaveRequest(
        @NotBlank(message = "주소 이름은 필수입니다.")
        @Size(max = 50, message = "주소 이름은 50자 이하로 입력해 주세요.")
        String addressName,

        @NotBlank(message = "우편번호는 필수입니다.")
        @Size(min = 5, max = 5, message = "우편번호는 5자리여야 합니다.")
        String zipcode,

        @NotBlank(message = "기본 주소는 필수입니다.")
        String address,

        String addressDetail
) {
    // Request DTO → Entity 변환 컨벤션
    public Address toEntity(Company company) {
        return Address.builder()
                .company(company)
                .addressName(this.addressName)
                .zipcode(this.zipcode)
                .address(this.address)
                .addressDetail(this.addressDetail)
                .build();
    }
}