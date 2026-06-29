package kr.remerge.stylehub.domain.order.checkout.service;

import kr.remerge.stylehub.domain.cart.dto.CartResponse;
import kr.remerge.stylehub.domain.cart.entity.CartItem;
import kr.remerge.stylehub.domain.cart.enumtype.CartType;
import kr.remerge.stylehub.domain.cart.repository.CartRepository;
import kr.remerge.stylehub.domain.company.entity.Address;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.company.repository.AddressRepository;
import kr.remerge.stylehub.domain.order.checkout.dto.*;
import kr.remerge.stylehub.domain.order.checkout.exception.CheckoutValidationException;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.entity.OrderItem;
import kr.remerge.stylehub.domain.order.entity.OrderLog;
import kr.remerge.stylehub.domain.order.enumtype.OrderLogMemo;
import kr.remerge.stylehub.domain.order.enumtype.OrderLogType;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
import kr.remerge.stylehub.domain.order.repository.OrderItemRepository;
import kr.remerge.stylehub.domain.order.repository.OrderLogRepository;
import kr.remerge.stylehub.domain.order.repository.OrderRepository;
import kr.remerge.stylehub.domain.product.entity.Product;
import kr.remerge.stylehub.domain.product.entity.ProductOption;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static java.util.stream.Collectors.groupingBy;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CheckoutService {

    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderLogRepository orderLogRepository;

    public CartCheckoutResponse getCartCheckout(Integer userId, CartCheckoutRequest cartCheckoutRequest) {

        List<Integer> cartItemIds = cartCheckoutRequest.cartItemIds().stream()
                .distinct()
                .toList();

        List<CartItem> cartItems = cartRepository.findByCartItemIdInAndUser_UserIdAndCartType(
                cartItemIds,
                userId,
                cartCheckoutRequest.cartType()
        );

        if (cartItems.size() != cartItemIds.size()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        List<CheckoutInvalidItemResponse> invalidItems = new ArrayList<>();

        for (CartItem cartItem : cartItems) {
            invalidItems.addAll(validateCartItem(cartItem));
        }

        if (!invalidItems.isEmpty()) {
            throw new CheckoutValidationException(
                    new CheckoutValidationErrorResponse(invalidItems)
            );
        }

        List<CartResponse> items = cartItems.stream()
                .map(CartResponse::from)
                .toList();

        long productAmount = items.stream()
                .mapToLong(CartResponse::totalPrice)
                .sum();

        long shippingFee = calculateShippingFee(items);


        return new CartCheckoutResponse(
                cartCheckoutRequest.cartType(),
                items,
                productAmount,
                shippingFee,
                productAmount + shippingFee
        );

    }

    private List<CheckoutInvalidItemResponse> validateCartItem(CartItem cartItem) {

        List<CheckoutInvalidItemResponse> invalidItems = new ArrayList<>();

        ProductOption option = cartItem.getProductOption();
        Product product = option.getProduct();

        int quantity = cartItem.getQuantity();

        if (Boolean.FALSE.equals(option.getIsActive())) {
            invalidItems.add(toInvalidItem(
                    cartItem,
                    ErrorCode.OPTION_INACTIVE,
                    quantity,
                    0
            ));
        }

        if (quantity > option.getStockQuantity()) {
            invalidItems.add(toInvalidItem(
                    cartItem,
                    ErrorCode.OUT_OF_STOCK,
                    quantity,
                    option.getStockQuantity()
            ));
        }

        if (cartItem.getCartType() == CartType.NORMAL
                && quantity < product.getMoq()) {
            invalidItems.add(toInvalidItem(
                    cartItem,
                    ErrorCode.MOQ_NOT_MET,
                    quantity,
                    product.getMoq()
            ));
        }

        if (cartItem.getCartType() == CartType.SAMPLE) {
            if (!product.getSampleAvailable()) {
                invalidItems.add(toInvalidItem(
                        cartItem,
                        ErrorCode.SAMPLE_NOT_AVAILABLE,
                        quantity,
                        0
                ));
            }

            if (option.getSamplePrice() == null
                    || option.getSampleMaxQuantity() == null) {
                invalidItems.add(toInvalidItem(
                        cartItem,
                        ErrorCode.SAMPLE_OPTION_NOT_CONFIGURED,
                        quantity,
                        0
                ));
            }

            if (option.getSampleMaxQuantity() != null
                    && quantity > option.getSampleMaxQuantity()) {
                invalidItems.add(toInvalidItem(
                        cartItem,
                        ErrorCode.SAMPLE_LIMIT_EXCEEDED,
                        quantity,
                        option.getSampleMaxQuantity()
                ));
            }
        }

        return invalidItems;
    }

    private CheckoutInvalidItemResponse toInvalidItem(
            CartItem cartItem,
            ErrorCode errorCode,
            Integer requestedQuantity,
            Integer availableQuantity
    ) {
        ProductOption option = cartItem.getProductOption();
        Product product = option.getProduct();

        return new CheckoutInvalidItemResponse(
                cartItem.getCartItemId(),
                product.getProductName(),
                option.getOptionLabel(),
                errorCode.name(),
                errorCode.getMessage(),
                requestedQuantity,
                availableQuantity
        );
    }

    private long calculateShippingFee(List<CartResponse> items) {

        Map<Integer, List<CartResponse>> itemsByCompany = items.stream()
                .collect(groupingBy(CartResponse::companyId));

        long totalShippingFee = 0L;

        for (List<CartResponse> companyItems : itemsByCompany.values()) {
            CartResponse firstItem = companyItems.get(0);
            long companyProductAmount = companyItems.stream()
                    .mapToLong(CartResponse::totalPrice)
                    .sum();

            Long freeShippingThreshold = firstItem.freeShippingThreshold();

            boolean isFreeShipping = freeShippingThreshold != null
                    && companyProductAmount >= freeShippingThreshold;

            if (!isFreeShipping) {
                totalShippingFee += firstItem.baseShippingFee();
            }
        }

        return totalShippingFee;
    }

    public List<AddressResponse> getAddress(Integer userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Integer companyId = user.getCompany().getCompanyId();

        Integer defaultAddressId = user.getDefaultReceivingAddress() == null
                ? null
                : user.getDefaultReceivingAddress().getAddressId();

        return addressRepository
                .findByCompany_CompanyIdAndDeletedAtIsNull(companyId)
                .stream()
                .map(address -> AddressResponse.from(
                        address,
                        address.getAddressId().equals(defaultAddressId)
                ))
                .toList();
    }

    @Transactional
    public AddressResponse createAddress(Integer userId, AddressCreateRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Company company = user.getCompany();

        if (company == null) {
            throw new BusinessException(ErrorCode.COMPANY_NOT_FOUND);
        }

        Address address = Address.builder()
                .company(company)
                .addressName(request.addressName())
                .zipcode(request.zipcode())
                .address(request.address())
                .addressDetail(request.addressDetail())
                .build();

        Address savedAddress = addressRepository.save(address);

        boolean isDefault = user.getDefaultReceivingAddress() == null;

        if (isDefault) {
            user.updateDefaultReceivingAddress(savedAddress);
        }

        return AddressResponse.from(savedAddress, isDefault);
    }

    public OrderCheckoutResponse getOrderCheckout(Integer userId, Integer orderId) {

        if (userId == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

        Order order = orderRepository.findByOrderIdAndBuyer_UserId(orderId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        List<OrderCheckoutItemResponse> items =
                orderItemRepository.findByOrder_OrderId(orderId)
                        .stream()
                        .map(OrderCheckoutItemResponse::from)
                        .toList();

        return new OrderCheckoutResponse(
                order.getOrderId(),
                order.getOrderNo(),
                items,
                order.getSubtotalAmount(),
                order.getShippingFee(),
                order.getTotalAmount()
        );

    }

    public MultiOrderCheckoutResponse getMultiOrderCheckout(Integer userId, List<Integer> orderIds) {

        List<Order> orders = findOwnedPendingOrders(userId, orderIds);
        List<Integer> distinctOrderIds = orders.stream()
                .map(Order::getOrderId)
                .toList();

        Map<Integer, List<OrderItem>> itemsByOrderId =
                orderItemRepository.
                        findByOrder_OrderIdInOrderByOrderItemIdAsc(distinctOrderIds)
                        .stream()
                        .collect(groupingBy(
                                orderItem -> orderItem.getOrder().getOrderId()
                        ));

        List<OrderCheckoutResponse> orderResponses = orders.stream()
                .map(order -> {
                    List<OrderCheckoutItemResponse> items =
                            itemsByOrderId.
                                    getOrDefault(order.getOrderId(), List.of())
                                    .stream()
                                    .map(OrderCheckoutItemResponse::from)
                                    .toList();

                    return new OrderCheckoutResponse(
                            order.getOrderId(),
                            order.getOrderNo(),
                            items,
                            order.getSubtotalAmount(),
                            order.getShippingFee(),
                            order.getTotalAmount()
                    );
                })
                .toList();

        long productAmount = orders.stream()
                .mapToLong(Order::getSubtotalAmount)
                .sum();

        long shippingFee = orders.stream()
                .mapToLong(Order::getShippingFee)
                .sum();

        long totalAmount = orders.stream()
                .mapToLong(Order::getTotalAmount)
                .sum();

        return new MultiOrderCheckoutResponse(
                orderResponses,
                productAmount,
                shippingFee,
                totalAmount
        );

    }

    @Transactional
    public DevOrderPaymentResponse completeDevOrderPayment(
            Integer userId,
            List<Integer> orderIds
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.USER_NOT_FOUND)
                );

        List<Order> orders = findOwnedPendingOrders(userId, orderIds);
        List<OrderLog> logs = new ArrayList<>();

        for (Order order : orders) {
            OrderStatus previousStatus = order.getStatus();

            order.confirmPayment();

            logs.add(OrderLog.createStatusLog(
                    order,
                    previousStatus,
                    order.getStatus(),
                    user,
                    OrderLogMemo.PAYMENT_CONFIRMED
            ));
        }
        orderLogRepository.saveAll(logs);

        orders.forEach(Order::confirmPayment);
        orderRepository.saveAll(orders);

        List<String> orderNos = orders.stream()
                .map(Order::getOrderNo)
                .toList();

        long totalAmount = orders.stream()
                .mapToLong(Order::getTotalAmount)
                .sum();

        return new DevOrderPaymentResponse(orderNos, totalAmount);
    }

    private List<Order> findOwnedPendingOrders(
            Integer userId,
            List<Integer> orderIds
    ) {

        userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        List<Integer> distinctOrderIds = orderIds.stream()
                .distinct()
                .toList();

        List<Order> orders =
                orderRepository.findByOrderIdInAndBuyer_UserId(distinctOrderIds, userId);

        if (orders.size() != distinctOrderIds.size()) {
            throw new BusinessException(ErrorCode.ORDER_NOT_FOUND);
        }

        boolean hasInvalidStatus = orders.stream()
                .anyMatch(order -> order.getStatus() != OrderStatus.PENDING);

        if (hasInvalidStatus) {
            throw new BusinessException(ErrorCode.INVALID_ORDER_STATUS);
        }

        return orders;
    }
}
