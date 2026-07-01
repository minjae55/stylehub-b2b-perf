package kr.remerge.stylehub.domain.contract.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SellerContractSignRequest(

        @NotBlank(message = "서명자명을 입력해주세요.")
        @Size(max = 100, message = "서명자명은 100자 이하여야 합니다.")
        String signatureText
) {
}
