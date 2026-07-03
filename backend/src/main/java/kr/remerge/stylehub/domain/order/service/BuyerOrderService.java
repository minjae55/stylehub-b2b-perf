package kr.remerge.stylehub.domain.order.service;

import kr.remerge.stylehub.domain.address.Address;
import kr.remerge.stylehub.domain.address.AddressRepository;
import kr.remerge.stylehub.domain.cart.entity.CartItem;
import kr.remerge.stylehub.domain.cart.enumtype.CartType;
import kr.remerge.stylehub.domain.cart.repository.CartRepository;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.order.dto.OrderCreateRequest;
import kr.remerge.stylehub.domain.order.dto.OrderCreateResponse;
import kr.remerge.stylehub.domain.order.dto.buyer.*;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.entity.OrderItem;
import kr.remerge.stylehub.domain.order.entity.OrderLog;
import kr.remerge.stylehub.domain.order.enumtype.OrderLogMemo;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
import kr.remerge.stylehub.domain.order.enumtype.OrderType;
import kr.remerge.stylehub.domain.order.enumtype.PaymentMethod;
import kr.remerge.stylehub.domain.order.repository.OrderItemRepository;
import kr.remerge.stylehub.domain.order.repository.OrderLogRepository;
import kr.remerge.stylehub.domain.order.repository.OrderRepository;
import kr.remerge.stylehub.domain.product.entity.Product;
import kr.remerge.stylehub.domain.product.entity.ProductOption;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.support.UserReader;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static java.util.stream.Collectors.groupingBy;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class BuyerOrderService {

    private final UserReader userReader;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final AddressRepository addressRepository;
    private final OrderLogRepository orderLogRepository;

    @Transactional
    public OrderCreateResponse createOrder(Integer userId, OrderCreateRequest request) {

        User buyer = userReader.getCompanyUser(userId);

        List<CartItem> cartItems = getCartItems(userId, request);

        Map<Integer, List<CartItem>> itemsByCompany = getItemsByCompany(cartItems);

        Address address = addressRepository.findById(request.addressId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ADDRESS_NOT_FOUND));

        ArrayList<String> orderNos = new ArrayList<>();
        List<OrderLog> orderLogs = new ArrayList<>();
        long checkoutTotalAmount = 0L;

        for (List<CartItem> companyItems : itemsByCompany.values()) {

            CartItem firstItem = companyItems.get(0);

            Company sellerCompany = firstItem.getProductOption()
                    .getProduct()
                    .getCompany();

            long subtotalAmount = companyItems.stream()
                    .mapToLong(this::calculateItemTotalPrice)
                    .sum();

            Order order = getOrder(request, buyer, sellerCompany, address, subtotalAmount);
            Order savedOrder = orderRepository.save(order);

            orderLogs.add(OrderLog.createStatusLog(
                    savedOrder,
                    null,
                    OrderStatus.PENDING,
                    buyer,
                    OrderLogMemo.ORDER_CREATED
            ));

            orderNos.add(savedOrder.getOrderNo());
            checkoutTotalAmount += savedOrder.getTotalAmount();

            List<OrderItem> orderItems =  companyItems.stream()
                    .map(cartItem -> {

                        ProductOption option = cartItem.getProductOption();
                        Product product = option.getProduct();

                        boolean isSample =
                                cartItem.getCartType() == CartType.SAMPLE;

                        long unitPrice = getUnitPrice(isSample, option, product);
                        long additionalPrice = getAdditionalPrice(isSample, option);
                        long totalPrice = calculateItemTotalPrice(cartItem);

                        return OrderItem.builder()
                                .order(savedOrder)
                                .product(product)
                                .productOption(option)
                                .assignedUser(product.getSeller())
                                .productName(product.getProductName())
                                .optionSummary(option.getOptionLabel())
                                .quantity(cartItem.getQuantity())
                                .unitPrice(unitPrice)
                                .additionalPrice(additionalPrice)
                                .totalPrice(totalPrice)
                                .productImageUrl(getImageUrl(option))
                                .build();
                    })
                    .toList();

            orderItemRepository.saveAll(orderItems);
        }

        orderLogRepository.saveAll(orderLogs);
        cartRepository.deleteAll(cartItems);

        return new OrderCreateResponse(orderNos,checkoutTotalAmount);
    }

    private long calculateItemTotalPrice(CartItem cartItem) {

        ProductOption option = cartItem.getProductOption();
        Product product = option.getProduct();

        boolean isSample =
                cartItem.getCartType() == CartType.SAMPLE;

        long unitPrice = getUnitPrice(isSample, option, product);
        long additionalPrice = getAdditionalPrice(isSample, option);

        return (unitPrice + additionalPrice) * cartItem.getQuantity();
    }

    private static long getAdditionalPrice(boolean isSample, ProductOption option) {

        return isSample
                ? 0L
                : option.getAdditionalPrice();
    }

    private static long getUnitPrice(boolean isSample, ProductOption option, Product product) {

        return isSample
                ? option.getSamplePrice()
                : product.getUnitPrice();
    }

    private static String getImageUrl(ProductOption productOption) {
        if (productOption.getImages().isEmpty()) {
            return null;
        }

        return productOption.getImages().get(0).getImageUrl();
    }

    private Order getOrder(OrderCreateRequest request, User buyer, Company sellerCompany, Address address, Long subtotalAmount) {

        Long freeShippingThreshold =
                sellerCompany.getFreeShippingThreshold();

        boolean isFreeShipping =
                freeShippingThreshold != null
                        && subtotalAmount >= freeShippingThreshold;

        long shippingFee = isFreeShipping
                ? 0L
                : sellerCompany.getBaseShippingFee();

        return Order.builder()
                .orderNo(createOrderNo())
                .buyer(buyer)
                .sellerCompany(sellerCompany)
                .orderType(OrderType.NORMAL)
                .status(OrderStatus.PENDING)
                .sellerCompanyName(sellerCompany.getName())
                .isSample(request.cartType() == CartType.SAMPLE)
                .subtotalAmount(subtotalAmount)
                .shippingFee(shippingFee)
                .totalAmount(subtotalAmount + shippingFee)
                .paymentMethod(PaymentMethod.CORP_CARD)
                .receiverName(buyer.getName())
                .receiverPhone(buyer.getPhone())
                .receiverZipcode(address.getZipcode())
                .receiverAddress(address.getAddress())
                .receiverAddressDetail(address.getAddressDetail())
                .build();
    }

    private List<CartItem> getCartItems(Integer userId, OrderCreateRequest request) {

        if (request.cartItemIds() == null || request.cartItemIds().isEmpty()) {
            throw new BusinessException(ErrorCode.CART_ITEM_EMPTY);
        }

        if (request.cartType() == null) {
            throw new BusinessException(ErrorCode.INVALID_CART_TYPE);
        }

        List<CartItem> cartItems = cartRepository.findByCartItemIdInAndUser_UserIdAndCartType(
                request.cartItemIds(),
                userId,
                request.cartType()
        );

        if (cartItems.size() != request.cartItemIds().size()) {
             throw new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND);
        }

        return cartItems;

    }

    private static Map<Integer, List<CartItem>> getItemsByCompany(List<CartItem> cartItems) {

        return cartItems.stream()
                .collect(groupingBy(
                        cartItem -> cartItem.getProductOption()
                                .getProduct()
                                .getCompany()
                                .getCompanyId()
                ));
    }

    private String createOrderNo() {

        String date = LocalDate.now()
                .format(DateTimeFormatter.BASIC_ISO_DATE);

        String random = UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 8)
                .toUpperCase();

        return "ORD-" + date + "-" + random;
    }

    public List<BuyerOrderListResponse> geyBuyerOrderList(Integer userId) {
        List<Order> orders = orderRepository.findByBuyer_UserIdOrderByCreatedAtDesc(userId);
        if (orders.isEmpty()) {
            return List.of();
        }

        List<Integer> orderIds = orders.stream()
                .map(Order::getOrderId)
                .toList();

        Map<Integer, List<OrderItem>> itemsByOrderId =
                orderItemRepository.findByOrder_OrderIdInOrderByOrderItemIdAsc(orderIds)
                        .stream()
                        .collect(groupingBy(orderItem -> orderItem.getOrder().getOrderId()));

        return orders
                .stream()
                .map(order -> BuyerOrderListResponse.from(
                        order,
                        itemsByOrderId.getOrDefault(order.getOrderId(), List.of())
                ))
                .toList();
    }

    public BuyerOrderOverviewResponse getOrderOverview(Integer userId, Integer orderId) {
        Order order = orderRepository.findByOrderIdAndBuyer_UserId(orderId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        BuyerOrderSummaryResponse orderAmountSummaryResponse
                = BuyerOrderSummaryResponse.from(order);

        List<OrderItem> orderItems =
                orderItemRepository.findByOrder_OrderId(order.getOrderId());

        List<BuyerOrderItemResponse> orderItemResponseList = orderItems.stream()
                .map(BuyerOrderItemResponse::from)
                .toList();

        return new BuyerOrderOverviewResponse(
                orderItemResponseList,
                orderAmountSummaryResponse,
                order.getStatus()
        );
    }

    public BuyerOrderDetailResponse getOrderDetail(Integer userId, Integer orderId) {
        Order order = orderRepository.findByOrderIdAndBuyer_UserId(orderId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));


        List<BuyerOrderLogResponse> orderLogResponseList =
                orderLogRepository.findByOrder_OrderIdOrderByCreatedAtAsc(order.getOrderId())
                        .stream()
                        .filter(orderLog -> orderLog.getNewStatus() != null)
                        .map(BuyerOrderLogResponse::from)
                        .toList();

        List<BuyerOrderDetailItemResponse> orderDetailItemResponseList = orderItemRepository.findByOrder_OrderId(orderId)
                .stream()
                .map(BuyerOrderDetailItemResponse::from)
                .toList();

        return BuyerOrderDetailResponse.from(order, orderDetailItemResponseList, orderLogResponseList);

    }
}
