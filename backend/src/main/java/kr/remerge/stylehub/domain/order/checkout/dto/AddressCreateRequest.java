package kr.remerge.stylehub.domain.order.checkout.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddressCreateRequest(

        @NotBlank
        @Size(max = 50)
        String addressName,

        @NotBlank
        @Size(max = 20)
        String zipcode,

        @NotBlank
        @Size(max = 255)
        String address,

        @Size(max = 255)
        String addressDetail
) {


}
