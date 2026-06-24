package kr.remerge.stylehub.domain.order.dto;

import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
import kr.remerge.stylehub.domain.order.enumtype.OrderType;
import kr.remerge.stylehub.domain.order.enumtype.PaymentMethod;

import java.time.LocalDateTime;

public record BuyerOrderListResponse(

        Integer orderId,
        String orderNo,
        OrderType orderType,
        OrderStatus orderStatus,
        boolean isSample,

        Long totalAmount,

        LocalDateTime createdAt,
        LocalDateTime canceledAt,

        String canceledReason


) {
    public static BuyerOrderListResponse from(Order order) {
        return new BuyerOrderListResponse(
                order.getOrderId(),
                order.getOrderNo(),
                order.getOrderType(),
                order.getStatus(),
                order.getIsSample(),

                order.getTotalAmount(),

                order.getCreatedAt(),
                order.getCanceledAt(),

                order.getCanceledReason()
        );
    }
}
