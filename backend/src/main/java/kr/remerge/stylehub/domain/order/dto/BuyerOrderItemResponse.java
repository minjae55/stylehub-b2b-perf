package kr.remerge.stylehub.domain.order.dto;

public record BuyerOrderItemResponse(

        Integer orderItemId,
        String productName,
        String optionSummary,

        Integer quantity,

        Long unitPrice,
        Long additionalPrice,
        Long totalPrice
) {
}
