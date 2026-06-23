package kr.remerge.stylehub.domain.order.service;

import kr.remerge.stylehub.domain.cart.entity.CartItem;
import kr.remerge.stylehub.domain.cart.enumtype.CartType;
import kr.remerge.stylehub.domain.cart.repository.CartRepository;
import kr.remerge.stylehub.domain.company.entity.Address;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.company.repository.AddressRepository;
import kr.remerge.stylehub.domain.order.OrderRepository;
import kr.remerge.stylehub.domain.order.dto.OrderCreateRequest;
import kr.remerge.stylehub.domain.order.dto.OrderCreateResponse;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.entity.OrderItem;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
import kr.remerge.stylehub.domain.order.enumtype.OrderType;
import kr.remerge.stylehub.domain.order.repository.OrderItemRepository;
import kr.remerge.stylehub.domain.product.entity.Product;
import kr.remerge.stylehub.domain.product.entity.ProductOption;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
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
public class OrderService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final AddressRepository addressRepository;

    @Transactional
    public OrderCreateResponse createOrder(Integer userId, OrderCreateRequest request) {

        User buyer = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        List<CartItem> cartItems = getCartItems(userId, request);

        Map<Integer, List<CartItem>> itemsByCompany = getItemsByCompany(cartItems);

        Address address = addressRepository.findById(request.addressId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ADDRESS_NOT_FOUND));

        ArrayList<String> orderNos = new ArrayList<>();
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
                                .build();
                    })
                    .toList();

            orderItemRepository.saveAll(orderItems);
        }

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
                .receiverName(buyer.getName())
                .receiverPhone(buyer.getPhone())
                .receiverZipcode(address.getZipcode())
                .receiverAddress(address.getAddress())
                .receiverAddressDetail(address.getAddressDetail())
                .build();
    }

    private List<CartItem> getCartItems(Integer userId, OrderCreateRequest request) {

        return cartRepository.findByCartItemIdInAndUser_UserIdAndCartType(
                request.cartItemIds(),
                userId,
                request.cartType()
        );

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
}
