package kr.remerge.stylehub.domain.order.service;

import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.entity.OrderLog;
import kr.remerge.stylehub.domain.order.enumtype.OrderLogMemo;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
import kr.remerge.stylehub.domain.order.repository.OrderLogRepository;
import kr.remerge.stylehub.domain.order.repository.OrderRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class OrderStatusService {

    private final OrderRepository orderRepository;
    private final OrderLogRepository orderLogRepository;

    @Transactional
    public void confirmPayments(
            List<Order> orders,
            User actor
    ) {
        boolean hasInvalidStatus = orders.stream()
                .anyMatch(order ->
                        order.getStatus() != OrderStatus.PENDING
                );

        if (hasInvalidStatus) {
            throw new BusinessException(ErrorCode.INVALID_ORDER_STATUS);
        }

        List<OrderLog> logs = orders.stream()
                .map(order -> {
                    OrderStatus previousStatus = order.getStatus();
                    order.confirmPayment();

                    return OrderLog.createStatusLog(
                            order,
                            previousStatus,
                            order.getStatus(),
                            actor,
                            OrderLogMemo.PAYMENT_CONFIRMED
                    );
                })
                .toList();

        orderLogRepository.saveAll(logs);
    }

    @Transactional
    public void changeStatus(Integer orderId, User actor, OrderStatus newStatus) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        OrderStatus previousStatus = order.getStatus();

        validateActor(order, actor, newStatus);
        validateTransition(previousStatus, newStatus);

        order.changeStatus(newStatus);

        OrderLog log = OrderLog.createStatusLog(
                order,
                previousStatus,
                newStatus,
                actor,
                getLogMemo(newStatus)
        );

        orderLogRepository.save(log);


    }

    private OrderLogMemo getLogMemo(OrderStatus newStatus) {

        return switch (newStatus) {
            case PREPARING ->
                    OrderLogMemo.PREPARING_STARTED;

            case SHIPPED ->
                    OrderLogMemo.SHIPPING_STARTED;

            case DELIVERED ->
                    OrderLogMemo.DELIVERY_COMPLETED;

            case COMPLETED ->
                    OrderLogMemo.ORDER_COMPLETED;

            case CANCELED ->
                    OrderLogMemo.ORDER_CANCELED;

            case DISPUTE ->
                    OrderLogMemo.DISPUTE_OPENED;

            default -> throw new BusinessException(
                    ErrorCode.INVALID_ORDER_STATUS
            );
        };
    }

    private void validateActor(Order order, User actor, OrderStatus newStatus) {

        if (actor == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        if (actor.getRole() == UserRole.ADMIN) {
            return;
        }

        boolean isBuyer = Objects.equals(
                order.getBuyer().getUserId(),
                actor.getUserId()
        );

        boolean isSellerCompanyMember =
                actor.getCompany() != null
                        && Objects.equals(
                        order.getSellerCompany().getCompanyId(),
                        actor.getCompany().getCompanyId()
                );

        boolean allowed = switch (newStatus) {
            case PREPARING, SHIPPED, DELIVERED ->
                    isSellerCompanyMember;

            case COMPLETED, DISPUTE ->
                    isBuyer;

            case CANCELED ->
                    isBuyer || isSellerCompanyMember;

            default -> false;
        };

        if (!allowed) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
    }

    private void validateTransition(OrderStatus currentStatus, OrderStatus newStatus) {

        boolean valid = switch (currentStatus) {
            case PENDING ->
                    newStatus == OrderStatus.CANCELED;

            case CONFIRMED ->
                    newStatus == OrderStatus.PREPARING
                            || newStatus == OrderStatus.CANCELED;

            case PREPARING ->
                    newStatus == OrderStatus.SHIPPED;

            case SHIPPED ->
                    newStatus == OrderStatus.DELIVERED;

            case DELIVERED ->
                    newStatus == OrderStatus.COMPLETED
                            || newStatus == OrderStatus.DISPUTE;

            default -> false;
        };

        if (!valid) {
            throw new BusinessException(
                    ErrorCode.INVALID_ORDER_STATUS
            );
        }
    }
}
