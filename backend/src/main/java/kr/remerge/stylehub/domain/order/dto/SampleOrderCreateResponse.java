package kr.remerge.stylehub.domain.order.dto;

import kr.remerge.stylehub.domain.order.entity.Order;

public record SampleOrderCreateResponse(
        Integer orderId,
        String orderNo,
        Long totalAmount
) {

    public static SampleOrderCreateResponse from(Order order) {

        return new SampleOrderCreateResponse(
                order.getOrderId(),
                order.getOrderNo(),
                order.getTotalAmount()
        );
    }
}
