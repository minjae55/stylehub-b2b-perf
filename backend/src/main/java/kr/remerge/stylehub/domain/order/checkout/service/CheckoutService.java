package kr.remerge.stylehub.domain.order.checkout.service;

import kr.remerge.stylehub.domain.cart.dto.CartResponse;
import kr.remerge.stylehub.domain.cart.entity.CartItem;
import kr.remerge.stylehub.domain.cart.enumtype.CartType;
import kr.remerge.stylehub.domain.cart.repository.CartRepository;
import kr.remerge.stylehub.domain.order.checkout.dto.CheckoutRequest;
import kr.remerge.stylehub.domain.order.checkout.dto.CheckoutResponse;
import kr.remerge.stylehub.domain.product.entity.Product;
import kr.remerge.stylehub.domain.product.entity.ProductOption;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static java.util.stream.Collectors.groupingBy;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CheckoutService {

    private final CartRepository cartRepository;

    public CheckoutResponse getCheckout(Integer userId, CheckoutRequest checkoutRequest) {

        List<Integer> cartItemIds = checkoutRequest.cartItemIds().stream()
                .distinct()
                .toList();

        List<CartItem> cartItems = cartRepository.findByCartItemIdInAndUser_UserIdAndCartType(
                cartItemIds,
                userId,
                checkoutRequest.cartType()
        );

        if (cartItems.size() != cartItemIds.size()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        for (CartItem cartItem : cartItems) {
            validateCartItem(cartItem);
        }

        List<CartResponse> items = cartItems.stream()
                .map(CartResponse::from)
                .toList();

        long productAmount = items.stream()
                .mapToLong(CartResponse::totalPrice)
                .sum();

        long shippingFee = calculateShippingFee(items);

        return new CheckoutResponse(
                checkoutRequest.cartType(),
                items,
                productAmount,
                shippingFee,
                productAmount + shippingFee
        );

    }

    private void validateCartItem(CartItem cartItem) {

        ProductOption option = cartItem.getProductOption();
        Product product = option.getProduct();

        int quantity = cartItem.getQuantity();

        if (!option.getIsActive()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        if (quantity > option.getStockQuantity()) {
            throw new BusinessException(ErrorCode.OUT_OF_STOCK);
        }

        if (cartItem.getCartType() == CartType.NORMAL
                && quantity < product.getMoq()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        if (cartItem.getCartType() == CartType.SAMPLE) {
            if (!product.getSampleAvailable()) {
                throw new BusinessException(ErrorCode.INVALID_INPUT);
            }

            if (option.getSamplePrice() == null
                    || option.getSampleMaxQuantity() == null) {
                throw new BusinessException(ErrorCode.INVALID_INPUT);
            }

            // ERroCode에 다음 내용으로 추가해달라고 해
            // SAMPLE_OPTION_NOT_CONFIGURED(400, "선택한 옵션은 현재 샘플 주문을 이용할 수 없습니다."),

            if (quantity > option.getSampleMaxQuantity()) {
                throw new BusinessException(ErrorCode.INVALID_INPUT);
            }
        }
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
}
