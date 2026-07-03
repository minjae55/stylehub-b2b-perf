package kr.remerge.stylehub.domain.order.checkout.dto;

import kr.remerge.stylehub.domain.order.entity.OrderItem;

public record OrderCheckoutItemResponse(
        Integer orderItemId,
        String imageUrl,
        String productName,
        String optionSummary,
        Integer quantity,
        Long unitPrice,
        Long additionalPrice,
        Long totalPrice
) {
    public static OrderCheckoutItemResponse from(OrderItem orderItem) {
        return new OrderCheckoutItemResponse(
                orderItem.getOrderItemId(),
                orderItem.getProductImageUrl(),
                orderItem.getProductName(),
                orderItem.getOptionSummary(),
                orderItem.getQuantity(),
                orderItem.getUnitPrice(),
                orderItem.getAdditionalPrice(),
                orderItem.getTotalPrice()
        );
    }
}
