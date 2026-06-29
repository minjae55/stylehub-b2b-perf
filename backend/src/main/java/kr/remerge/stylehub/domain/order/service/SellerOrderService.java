package kr.remerge.stylehub.domain.order.service;

import kr.remerge.stylehub.domain.order.dto.seller.SellerOrderListResponse;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.entity.OrderItem;
import kr.remerge.stylehub.domain.order.repository.OrderItemRepository;
import kr.remerge.stylehub.domain.order.repository.OrderRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static java.util.stream.Collectors.groupingBy;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SellerOrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;

    public List<SellerOrderListResponse> getSellerOrderList(Integer userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.USER_NOT_FOUND)
                );

        List<Order> orders;
        Map<Integer, List<OrderItem>> itemsByOrderId;

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
        }

        return orders.stream()
                .map(order -> SellerOrderListResponse.from(
                        order,
                        itemsByOrderId.getOrDefault(
                                order.getOrderId(),
                                List.of()
                        )
                ))
                .toList();

    }
}
