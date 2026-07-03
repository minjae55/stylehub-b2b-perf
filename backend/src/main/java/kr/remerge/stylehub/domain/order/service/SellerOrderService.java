package kr.remerge.stylehub.domain.order.service;

import kr.remerge.stylehub.domain.order.dto.seller.*;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.entity.OrderItem;
import kr.remerge.stylehub.domain.order.enumtype.OrderItemStatus;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
import kr.remerge.stylehub.domain.order.repository.OrderItemRepository;
import kr.remerge.stylehub.domain.order.repository.OrderLogRepository;
import kr.remerge.stylehub.domain.order.repository.OrderRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;
import kr.remerge.stylehub.domain.user.support.UserReader;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;

import static java.util.stream.Collectors.groupingBy;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SellerOrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderLogRepository orderLogRepository;
    private final UserReader userReader;
    private final OrderStatusService orderStatusService;

    public List<SellerOrderListResponse> getSellerOrderList(Integer userId) {

        User user = userReader.getCompanyUser(userId);

        List<Order> orders;
        Map<Integer, List<OrderItem>> itemsByOrderId;
        Map<Integer, List<OrderItem>> allItemsByOrderId;

        if (user.getRole() == UserRole.PRESIDENT) {
            Integer companyId = user.getCompany().getCompanyId();

            orders = orderRepository
                    .findBySellerCompany_CompanyIdOrderByCreatedAtDesc(companyId);

            if (orders.isEmpty()) {
                return List.of();
            }

            List<Integer> orderIds = orders.stream()
                    .map(Order::getOrderId)
                    .toList();

            itemsByOrderId = orderItemRepository
                    .findByOrder_OrderIdInOrderByOrderItemIdAsc(orderIds)
                    .stream()
                    .collect(groupingBy(
                            orderItem -> orderItem.getOrder().getOrderId()
                    ));

            allItemsByOrderId = itemsByOrderId;
        } else {
            List<OrderItem> assignedItems = orderItemRepository
                    .findByAssignedUser_UserIdOrderByOrder_CreatedAtDesc(userId);

                if (assignedItems.isEmpty()) {
                    return List.of();
            }

            orders = assignedItems.stream()
                    .map(OrderItem::getOrder)
                    .distinct()
                    .toList();

            itemsByOrderId = assignedItems.stream()
                    .collect(groupingBy(
                            orderItem -> orderItem.getOrder().getOrderId()
                    ));

            List<Integer> orderIds = orders.stream()
                    .map(Order::getOrderId)
                    .toList();

            allItemsByOrderId = orderItemRepository
                    .findByOrder_OrderIdInOrderByOrderItemIdAsc(orderIds)
                    .stream()
                    .collect(groupingBy(
                            orderItem -> orderItem.getOrder().getOrderId()
                    ));
        }

        return orders.stream()
                .map(order -> SellerOrderListResponse.from(
                        order,
                        itemsByOrderId.getOrDefault(
                                order.getOrderId(),
                                List.of()
                        ),
                        allItemsByOrderId.getOrDefault(
                                order.getOrderId(),
                                List.of()
                        )
                ))
                .toList();

    }

    @Transactional
    public SellerOrderDetailResponse getSellerOrderDetail(Integer userId, Integer orderId) {

        User user = userReader.getCompanyUser(userId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));


        boolean sameCompany =
                user.getCompany() != null
                        && Objects.equals(
                        user.getCompany().getCompanyId(),
                        order.getSellerCompany().getCompanyId()
                );

        if (!sameCompany) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        boolean isSellerMember =
                user.getRole() == UserRole.PRESIDENT
                        || user.getRole() == UserRole.EMPLOYEE;

        if (!isSellerMember) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        List<OrderItem> visibleItems =
                orderItemRepository.findByOrder_OrderId(orderId);

        List<SellerOrderItemResponse> orderItemList = visibleItems
                .stream()
                .map(item -> SellerOrderItemResponse.from(item, user))
                .toList();

        SellerOrderAmountResponse amountResponse = SellerOrderAmountResponse.from(order);
        SellerOrderDeliveryResponse deliveryResponse = SellerOrderDeliveryResponse.from(order);

        List<SellerOrderLogResponse> orderLogResponses = orderLogRepository.findByOrder_OrderIdOrderByCreatedAtAsc(orderId)
                .stream()
                .map(SellerOrderLogResponse::from)
                .toList();

        SellerOrderPreparationResponse preparationResponse = getPreparationResponse(orderId);


        return SellerOrderDetailResponse.from(order, orderItemList, amountResponse, deliveryResponse, orderLogResponses, preparationResponse);
    }

    private SellerOrderPreparationResponse getPreparationResponse(Integer orderId) {
        long totalItemCount
                = orderItemRepository.countByOrder_OrderId(orderId);

        long readyItemCount =
                orderItemRepository.countByOrder_OrderIdAndItemStatus(
                        orderId,
                        OrderItemStatus.READY
                );

        boolean allItemsReady =
                totalItemCount > 0 && totalItemCount == readyItemCount;

        return SellerOrderPreparationResponse.from(totalItemCount, readyItemCount, allItemsReady);
    }

    @Transactional
    public void updateOrderStatus(Integer userId, Integer orderId, OrderStatus status) {

        User user = userReader.getCompanyUser(userId);

        orderStatusService.changeStatus(orderId, user, status);
    }

    @Transactional
    public void markOrderItemReady(
            Integer userId,
            Integer orderItemId
    ) {
        OrderItem orderItem = orderItemRepository
                .findByOrderItemIdAndAssignedUser_UserId(
                        orderItemId,
                        userId
                )
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.FORBIDDEN));

        Order order = orderItem.getOrder();

        if (order.getStatus() != OrderStatus.CONFIRMED
                && order.getStatus() != OrderStatus.PREPARING) {
            throw new BusinessException(ErrorCode.INVALID_ORDER_STATUS);
        }

        orderItem.markReady();

        if (order.getStatus() == OrderStatus.CONFIRMED) {
            User actor = orderItem.getAssignedUser();

            orderStatusService.changeStatus(
                    order.getOrderId(),
                    actor,
                    OrderStatus.PREPARING
            );
        }
    }

    @Transactional
    public void markAllOrderItemsReady(
            Integer userId,
            Integer orderId
    ) {
        User user = userReader.getCompanyUser(userId);

        if (user.getRole() != UserRole.PRESIDENT) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        if (order.getStatus() != OrderStatus.CONFIRMED
                && order.getStatus() != OrderStatus.PREPARING) {
            throw new BusinessException(ErrorCode.INVALID_ORDER_STATUS);
        }

        boolean sameCompany = Objects.equals(
                user.getCompany().getCompanyId(),
                order.getSellerCompany().getCompanyId()
        );

        if (!sameCompany) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        List<OrderItem> items =
                orderItemRepository.findByOrder_OrderId(orderId);

        items.forEach(OrderItem::markReady);

        if (order.getStatus() == OrderStatus.CONFIRMED) {
            orderStatusService.changeStatus(
                    orderId,
                    user,
                    OrderStatus.PREPARING
            );
        }
    }

    @Transactional
    public void registerShipment(Integer userId, Integer orderId, OrderShipmentRequest request) {

        User user = userReader.getCompanyUser(userId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        boolean sameCompany =
                user.getCompany() != null
                        && Objects.equals(
                        user.getCompany().getCompanyId(),
                        order.getSellerCompany().getCompanyId()
                );

        if (!sameCompany) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        if (order.getStatus() != OrderStatus.PREPARING) {
            throw new BusinessException(ErrorCode.INVALID_ORDER_STATUS);
        }

        long totalItemCount =
                orderItemRepository.countByOrder_OrderId(orderId);

        long readyItemCount =
                orderItemRepository.countByOrder_OrderIdAndItemStatus(
                        orderId,
                        OrderItemStatus.READY
                );

        if (totalItemCount == 0 || totalItemCount != readyItemCount) {
            throw new BusinessException(ErrorCode.ORDER_ITEMS_NOT_READY);
        }

        order.registerShipment(
                request.carrier().trim(),
                request.trackingNumber().trim()
        );

        orderStatusService.changeStatus(
                orderId,
                user,
                OrderStatus.SHIPPED
        );

    }
}
