package kr.remerge.stylehub.domain.order.checkout.dto;

import java.util.List;

public record OrderCheckoutResponse(
        Integer orderId,
        String orderNo,
        List<OrderCheckoutItemResponse> items,
        Long productAmount,
        Long shippingFee,
        Long totalAmount
) {
}
