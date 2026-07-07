package kr.remerge.stylehub.domain.order.dto.buyer;

import kr.remerge.stylehub.domain.order.entity.OrderItem;

public record BuyerOrderDetailItemResponse(
        Integer orderItemId,

        String productName,
        String brandName,
        String optionSummary,
        Integer quantity,

        Long unitPrice,
        Long totalPrice,
        String imageUrl
) {

    public static BuyerOrderDetailItemResponse from(OrderItem orderItem) {

        String brandName = orderItem.getProduct() != null
                ? orderItem.getProduct().getBrand().getBrandName()
                : null;

        return new BuyerOrderDetailItemResponse(
                orderItem.getOrderItemId(),

                orderItem.getProductName(),
                brandName,
                orderItem.getOptionSummary(),
                orderItem.getQuantity(),

                orderItem.getUnitPrice(),
                orderItem.getTotalPrice(),
                orderItem.getProductImageUrl()

        );

    }
}
