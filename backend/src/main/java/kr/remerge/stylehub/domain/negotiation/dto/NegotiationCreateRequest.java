package kr.remerge.stylehub.domain.negotiation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record NegotiationCreateRequest(

        @Positive
        Integer quoteId,

        @Positive
        Integer contractId,

        @NotBlank
        @Size(max = 2000, message = "요청 내용은 2000자 이하여야 합니다.")
        String content,

        @PositiveOrZero(message = "희망 단가는 0원 이상이어야 합니다.")
        Long desiredUnitPrice,

        @PositiveOrZero(message = "희망 납기는 0일 이상이어야 합니다.")
        Integer desiredLeadTimeDays,

        @NotBlank(message = "선택된 협의 유형이 없습니다.")
        String negotiationType


) {
}