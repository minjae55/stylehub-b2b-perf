package kr.remerge.stylehub.domain.order.dto.buyer;

import kr.remerge.stylehub.domain.order.entity.OrderItem;

public record BuyerOrderItemResponse(

        Integer orderItemId,
        String productName,
        String optionSummary,

        Integer quantity,

        Long unitPrice,
        Long additionalPrice,
        Long totalPrice
) {

    public static BuyerOrderItemResponse from(OrderItem orderItem) {

        return new BuyerOrderItemResponse(
                orderItem.getOrderItemId(),
                orderItem.getProductName(),
                orderItem.getOptionSummary(),

                orderItem.getQuantity(),

                orderItem.getUnitPrice(),
                orderItem.getAdditionalPrice(),
                orderItem.getTotalPrice()
        );
    }
}
