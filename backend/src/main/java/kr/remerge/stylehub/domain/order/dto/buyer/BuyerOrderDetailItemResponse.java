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
        String imageUrl,

        // 다시 주문하기(재주문) 시 장바구니 담기 API가 필요로 하는 값.
        // 상품/옵션이 이후 삭제됐을 수 있어 null일 수 있다 — 그 경우 프론트에서 해당 품목은 건너뛴다.
        Integer productOptionId
) {

    public static BuyerOrderDetailItemResponse from(OrderItem orderItem) {

        String brandName = orderItem.getProduct() != null
                ? orderItem.getProduct().getBrand().getBrandName()
                : null;

        Integer productOptionId = orderItem.getProductOption() != null
                ? orderItem.getProductOption().getProductOptionId()
                : null;

        return new BuyerOrderDetailItemResponse(
                orderItem.getOrderItemId(),

                orderItem.getProductName(),
                brandName,
                orderItem.getOptionSummary(),
                orderItem.getQuantity(),

                orderItem.getUnitPrice(),
                orderItem.getTotalPrice(),
                orderItem.getProductImageUrl(),

                productOptionId
        );
    }
}