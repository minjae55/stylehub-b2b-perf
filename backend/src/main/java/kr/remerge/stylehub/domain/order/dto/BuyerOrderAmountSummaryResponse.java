package kr.remerge.stylehub.domain.order.dto;

public record BuyerOrderAmountSummaryResponse(
        Long subtotalAmount,
        Long shippingFee,
        Long platformFee,
        Long totalAmount
) {
}
