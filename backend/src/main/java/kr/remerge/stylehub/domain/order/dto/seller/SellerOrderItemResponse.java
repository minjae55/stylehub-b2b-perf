package kr.remerge.stylehub.domain.order.dto.seller;

import kr.remerge.stylehub.domain.order.entity.OrderItem;
import kr.remerge.stylehub.domain.order.enumtype.OrderItemStatus;
import kr.remerge.stylehub.domain.user.entity.User;

import java.time.LocalDateTime;
import java.util.Objects;

public record SellerOrderItemResponse(
        Integer orderItemId,
        String productName,
        String optionSummary,
        Integer quantity,
        Long unitPrice,
        Long totalPrice,
        String productImageUrl,
        OrderItemStatus itemStatus,
        LocalDateTime preparedAt,
        boolean assignedToMe,
        // 다른 담당자 상품일 때 화면에 "OO 담당자의 상품"처럼 표시하기 위한 이름.
        String assignedUserName,
        boolean canPrepare
) {

    public static SellerOrderItemResponse from(OrderItem orderItem, User user) {
        boolean assignedToMe = Objects.equals(
                orderItem.getAssignedUser().getUserId(),
                user.getUserId()
        );

        // 대표(PRESIDENT)든 직원(EMPLOYEE)이든, 본인에게 배정된 상품이면 개별로
        // 준비 완료 처리를 할 수 있어야 한다. 이전에는 EMPLOYEE만 가능하도록 막혀 있어서
        // 대표 본인이 담당자인 상품(직원을 두기 전에 직접 등록한 상품 등)은 "전체 준비 완료"
        // 일괄 처리로만 처리할 수 있었다.
        boolean canPrepare = assignedToMe;

        return new SellerOrderItemResponse(
                orderItem.getOrderItemId(),
                orderItem.getProductName(),
                orderItem.getOptionSummary(),
                orderItem.getQuantity(),
                orderItem.getUnitPrice(),
                orderItem.getTotalPrice(),
                orderItem.getProductImageUrl(),
                orderItem.getItemStatus(),
                orderItem.getPreparedAt(),
                assignedToMe,
                orderItem.getAssignedUser().getName(),
                canPrepare
        );
    }

}
