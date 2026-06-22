package kr.remerge.stylehub.domain.order.checkout.dto;

import kr.remerge.stylehub.domain.company.entity.Address;

public record AddressResponse(
        Integer addressId,
        String addressName,
        String zipcode,
        String address,
        String addressDetail,
        Boolean isDefault
) {


    public static AddressResponse from(Address address, boolean isDefault) {
        return new AddressResponse(
                address.getAddressId(),
                address.getAddressName(),
                address.getZipcode(),
                address.getAddress(),
                address.getAddressDetail(),
                isDefault
        );
    }
}
