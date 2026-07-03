package kr.remerge.stylehub.domain.address.dto.request;

public record UserDefaultsResponse(
        Integer shippingAddressId,
        Integer receivingAddressId
) {
}