package kr.remerge.stylehub.domain.contract.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BuyerContractSignRequest(

        @NotBlank
        @Size(max = 100)
        String signatureText,

        @NotBlank
        @Size(max = 2000)
        String signatureImageUrl
) {
}
