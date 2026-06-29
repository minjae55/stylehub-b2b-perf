package kr.remerge.stylehub.domain.order.dto.buyer;

import kr.remerge.stylehub.domain.order.entity.OrderLog;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;

import java.time.LocalDateTime;

public record BuyerOrderLogResponse(
        OrderStatus previousStatus,
        OrderStatus newStatus,
        String memo,
        String changedBy,
        LocalDateTime createdAt
) {
    public static BuyerOrderLogResponse from(OrderLog orderLog) {
        String changedBy = orderLog.getActorUser() == null
                ? "SYSTEM"
                : orderLog.getActorUser().getName();

        return new BuyerOrderLogResponse(
                orderLog.getPreviousStatus(),
                orderLog.getNewStatus(),
                orderLog.getMemo(),
                changedBy,
                orderLog.getCreatedAt()
        );
    }
}
