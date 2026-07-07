package kr.remerge.stylehub.domain.order.service;

import kr.remerge.stylehub.domain.deliveryTracker.DeliveryCarrier;
import kr.remerge.stylehub.domain.order.dto.seller.*;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.entity.OrderItem;
import kr.remerge.stylehub.domain.order.entity.OrderLog;
import kr.remerge.stylehub.domain.order.enumtype.OrderItemStatus;
import kr.remerge.stylehub.domain.order.enumtype.OrderLogMemo;
import kr.remerge.stylehub.domain.order.enumtype.OrderProcessStep;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
import kr.remerge.stylehub.domain.order.enumtype.OrderType;
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

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
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

            if (order.getOrderType() == OrderType.CUSTOM) {
                orderLogRepository.save(
                        OrderLog.createProcessLog(
                                order,
                                order.getIsSample()
                                        ? OrderProcessStep.SAMPLE_PREPARING
                                        : OrderProcessStep.PRODUCTION_STARTED,
                                actor,
                                order.getIsSample()
                                        ? "샘플 준비가 시작되었습니다."
                                        : "본 생산이 시작되었습니다."
                        )
                );
            }
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

            if (order.getOrderType() == OrderType.CUSTOM) {
                orderLogRepository.save(
                        OrderLog.createProcessLog(
                                order,
                                order.getIsSample()
                                        ? OrderProcessStep.SAMPLE_PREPARING
                                        : OrderProcessStep.PRODUCTION_STARTED,
                                user,
                                order.getIsSample()
                                        ? "샘플 준비가 시작되었습니다."
                                        : "본생산이 시작되었습니다."
                        )
                );

            }
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

        if (order.getOrderType() == OrderType.CUSTOM) {
            orderLogRepository.save(
                    OrderLog.createProcessLog(
                            order,
                            order.getIsSample()
                                    ? OrderProcessStep.SAMPLE_SHIPPED
                                    : OrderProcessStep.PRODUCTION_COMPLETED,
                            user,
                            order.getIsSample()
                                    ? "샘플이 발송되었습니다."
                                    : "본 생산이 완료되어 발송되었습니다."
                    )
            );
        }
    }

    // [테스트용] 실제 배송 API 연동(DeliveryTrackingStatusService의 자동 동기화) 없이
    // 배송완료 상태로 즉시 전환한다. 데모/QA 목적의 임시 버튼 전용 메서드.
    @Transactional
    public void markDeliveredTest(Integer userId, Integer orderId) {

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

        if (order.getStatus() != OrderStatus.SHIPPED) {
            throw new BusinessException(ErrorCode.INVALID_ORDER_STATUS);
        }

        // 리머지택배(더미 캐리어)는 운송장 번호 자체가 "배송 완료 시각"(3시간 슬롯, UTC)이라
        // 실제 배송 추적 조회(GET /delivery/orders/{orderId})는 외부 더미 API를 그대로 호출한다.
        // 주문 상태만 DELIVERED로 바꿔서는 배송 추적 화면이 여전히 "배송 중"으로 보이므로,
        // 운송장 번호를 이미 지난 슬롯으로 되돌려서 실제 조회 결과도 배송완료로 나오게 한다.
        if (DeliveryCarrier.DUMMY.getName().equals(order.getCarrier())) {
            order.updateTrackingNumber(getDummyTrackingNumber(0));
        }

        OrderStatus previousStatus = order.getStatus();

        // deliveredAt + status 동시 세팅 (실제 배송추적 동기화와 동일한 엔티티 메서드 재사용)
        order.markDelivered();

        orderLogRepository.save(
                OrderLog.createStatusLog(
                        order,
                        previousStatus,
                        OrderStatus.DELIVERED,
                        user,
                        OrderLogMemo.DELIVERY_COMPLETED
                )
        );
    }

    // 프론트(SellerOrderDetail.tsx)의 getDummyTrackingNumber()와 동일한 3시간 슬롯 규칙.
    // slotsAhead=0은 "지금 이 순간 이미 지난(또는 막 도달한) 슬롯"이 되어, 더미 캐리어 API가
    // 즉시 배송완료로 응답하게 만든다.
    private String getDummyTrackingNumber(int slotsAhead) {
        ZonedDateTime nowUtc = ZonedDateTime.now(ZoneOffset.UTC);
        int flooredHour = (nowUtc.getHour() / 3) * 3;

        Instant slot = nowUtc
                .truncatedTo(ChronoUnit.DAYS)
                .plusHours((long) flooredHour + (long) slotsAhead * 3)
                .toInstant();

        return slot.toString();
    }
}