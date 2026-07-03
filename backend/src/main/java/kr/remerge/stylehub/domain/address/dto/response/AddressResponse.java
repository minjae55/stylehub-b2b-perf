package kr.remerge.stylehub.domain.address.dto.response;

import kr.remerge.stylehub.domain.address.Address;

import java.time.LocalDateTime;

public record AddressResponse(
        Integer addressId,
        Integer companyId,
        String addressName,
        String zipcode,
        String address,
        String addressDetail,
        LocalDateTime createdAt,
        LocalDateTime deletedAt
) {
    // Entity → Response DTO 전환 컨벤션 (of/from)
    public static AddressResponse from(Address address) {
        return new AddressResponse(
                address.getAddressId(),
                address.getCompany().getCompanyId(),
                address.getAddressName(),
                address.getZipcode(),
                address.getAddress(),
                address.getAddressDetail(),
                address.getCreatedAt(),
                address.getDeletedAt()
        );
    }
}