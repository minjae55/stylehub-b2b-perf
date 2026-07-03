package kr.remerge.stylehub.domain.address.dto.response;

public record AddressDefaultsResponse(
        CompanyDefaultsResponse company,
        UserDefaultsResponse user
) {
    // 회사용 부속품 record
    public record CompanyDefaultsResponse(
            Integer returnAddressId
    ) {
    }

    // 유저용 부속품 record
    public record UserDefaultsResponse(
            Integer shippingAddressId,
            Integer receivingAddressId
    ) {
    }
}