package kr.remerge.stylehub.domain.order.dto.seller;

import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.entity.OrderItem;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;

import java.time.LocalDateTime;
import java.util.List;

public record SellerOrderListResponse(

        Integer orderId,
        String orderNo,

        OrderStatus orderStatus,
        Boolean isSample,

        String representativeProductName,
        Integer itemCount,
        Integer totalQuantity,
        Long productAmount,

        LocalDateTime createdAt
) {

    public static SellerOrderListResponse from(
            Order order,
            List<OrderItem> visibleItems
    ) {
        String representativeProductName = visibleItems.isEmpty()
                ? "담당 상품이 없습니다."
                : visibleItems.get(0).getProductName();

        int totalQuantity = visibleItems.stream()
                .mapToInt(OrderItem::getQuantity)
                .sum();

        long productAmount = visibleItems.stream()
                .mapToLong(OrderItem::getTotalPrice)
                .sum();

        return new SellerOrderListResponse(
                order.getOrderId(),
                order.getOrderNo(),
                order.getStatus(),
                order.getIsSample(),
                representativeProductName,
                visibleItems.size(),
                totalQuantity,
                productAmount,
                order.getCreatedAt()
        );
    }
}
