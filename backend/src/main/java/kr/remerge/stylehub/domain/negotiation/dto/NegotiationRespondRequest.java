package kr.remerge.stylehub.domain.negotiation.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record NegotiationRespondRequest(

        @Size(max = 2000, message = "셀러 메모는 2,000자 이하로 입력해주세요.")
        String sellerMemo,

        // ── QUOTE(재견적) 응답용 ──
        @Positive(message = "납기일은 1일 이상이어야 합니다.")
        Integer leadTimeDays,

        @PositiveOrZero(message = "배송비는 0원 이상이어야 합니다.")
        Long shippingFee,

        @Future(message = "견적 유효기간은 현재보다 이후여야 합니다.")
        LocalDateTime validUntil,

        @Valid
        List<Item> items,

        // ── CONTRACT(재계약) 응답용 ──
        @Size(max = 150, message = "계약명은 150자 이하여야 합니다.")
        String contractName,

        LocalDate deliveryDate,

        @Size(max = 500)
        String paymentTerms,

        @Size(max = 2000)
        String returnPolicy,

        @Size(max = 2000)
        String specialTerms,

        @PositiveOrZero
        Long contractAmount

) {

    public record Item(

            @NotBlank(message = "옵션 정보를 입력해주세요.")
            @Size(max = 255)
            String optionSummary,

            @NotNull
            @Positive(message = "수량은 1개 이상이어야 합니다.")
            Integer quantity,

            @NotNull
            @PositiveOrZero(message = "단가는 0원 이상이어야 합니다.")
            Long unitPrice,

            @NotNull
            Boolean sample
    ) {
    }
}
