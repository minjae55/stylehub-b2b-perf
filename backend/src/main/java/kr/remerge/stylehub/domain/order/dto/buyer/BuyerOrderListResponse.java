package kr.remerge.stylehub.domain.order.dto.buyer;

import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.entity.OrderItem;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
import kr.remerge.stylehub.domain.order.enumtype.OrderType;

import java.time.LocalDateTime;
import java.util.List;

public record BuyerOrderListResponse(

        Integer orderId,
        String orderNo,
        OrderType orderType,
        OrderStatus orderStatus,
        boolean isSample,

        Long totalAmount,
        String representativeProductName,
        Integer itemCount,
        Integer totalQuantity,

        LocalDateTime createdAt,
        LocalDateTime canceledAt,

        String canceledReason,

        // 소싱(견적 기반) 주문의 재협의 요청 등에 사용. 일반 주문은 null.
        Integer quoteId

) {
    public static BuyerOrderListResponse from(Order order, List<OrderItem> orderItems) {
        String representativeProductName = orderItems.isEmpty()
                ? "주문 상품 정보 없음"
                : orderItems.get(0).getProductName();
        int totalQuantity = orderItems.stream()
                .mapToInt(OrderItem::getQuantity)
                .sum();

        return new BuyerOrderListResponse(
                order.getOrderId(),
                order.getOrderNo(),
                order.getOrderType(),
                order.getStatus(),
                order.getIsSample(),

                order.getTotalAmount(),
                representativeProductName,
                orderItems.size(),
                totalQuantity,

                order.getCreatedAt(),
                order.getCanceledAt(),

                order.getCanceledReason(),

                order.getQuote() != null ? order.getQuote().getQuoteId() : null
        );
    }
}
