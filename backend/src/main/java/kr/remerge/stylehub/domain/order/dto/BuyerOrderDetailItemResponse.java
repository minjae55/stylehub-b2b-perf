package kr.remerge.stylehub.domain.order.dto;

import kr.remerge.stylehub.domain.order.entity.OrderItem;

public record BuyerOrderDetailItemResponse(
        Integer orderItemId,

        String productName,
        String optionSummary,
        Integer quantity,

        Long unitPrice,
        Long totalPrice
) {

    public static BuyerOrderDetailItemResponse from(OrderItem orderItem) {

        return new BuyerOrderDetailItemResponse(
                orderItem.getOrderItemId(),

                orderItem.getProductName(),
                orderItem.getOptionSummary(),
                orderItem.getQuantity(),

                orderItem.getUnitPrice(),
                orderItem.getTotalPrice()

        );

    }
}
