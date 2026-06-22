package kr.remerge.stylehub.domain.order.checkout.service;

import kr.remerge.stylehub.domain.cart.dto.CartResponse;
import kr.remerge.stylehub.domain.cart.entity.CartItem;
import kr.remerge.stylehub.domain.cart.enumtype.CartType;
import kr.remerge.stylehub.domain.cart.repository.CartRepository;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.order.checkout.dto.CheckoutRequest;
import kr.remerge.stylehub.domain.order.checkout.dto.CheckoutResponse;
import kr.remerge.stylehub.domain.product.entity.Product;
import kr.remerge.stylehub.domain.product.entity.ProductOption;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CheckoutService {

    private final CartRepository cartRepository;

    public CheckoutResponse getCheckout(Integer userId, CheckoutRequest request) {
        List<Integer> cartItemIds = request.cartItemIds().stream().distinct().toList();

        List<CartItem> cartItems = cartRepository
                .findByCartItemIdInAndUser_UserIdAndCartType(
                        cartItemIds,
                        userId,
                        request.cartType()
                );

        if (cartItems.size() != cartItemIds.size()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        cartItems.forEach(this::validateCartItem);

        List<CartResponse> items = cartItems.stream()
                .map(CartResponse::from)
                .toList();

        long productAmount = items.stream()
                .mapToLong(CartResponse::totalPrice)
                .sum();

        long shippingFee = calculateShippingFee(cartItems);

        return new CheckoutResponse(
                request.cartType(),
                items,
                productAmount,
                shippingFee,
                productAmount + shippingFee
        );
    }

    private void validateCartItem(CartItem cartItem) {
        ProductOption productOption = cartItem.getProductOption();
        Product product = productOption.getProduct();
        int quantity = cartItem.getQuantity();

        if (!productOption.getIsActive() || quantity > productOption.getStockQuantity()) {
            throw new BusinessException(ErrorCode.OUT_OF_STOCK);
        }

        if (cartItem.getCartType() == CartType.NORMAL && quantity < product.getMoq()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        if (cartItem.getCartType() == CartType.SAMPLE) {
            if (!product.getSampleAvailable()
                    || productOption.getSamplePrice() == null
                    || productOption.getSampleMaxQuantity() == null
                    || quantity > productOption.getSampleMaxQuantity()) {
                throw new BusinessException(ErrorCode.INVALID_INPUT);
            }
        }
    }

    private long calculateShippingFee(List<CartItem> cartItems) {
        Map<Integer, CompanyCartTotal> totalsByCompany = new LinkedHashMap<>();

        for (CartItem cartItem : cartItems) {
            Company company = cartItem.getProductOption().getProduct().getCompany();
            if (company == null) {
                throw new BusinessException(ErrorCode.COMPANY_NOT_FOUND);
            }

            long itemTotal = CartResponse.from(cartItem).totalPrice();
            totalsByCompany
                    .computeIfAbsent(
                            company.getCompanyId(),
                            ignored -> new CompanyCartTotal(company)
                    )
                    .add(itemTotal);
        }

        return totalsByCompany.values().stream()
                .mapToLong(CompanyCartTotal::shippingFee)
                .sum();
    }

    private static class CompanyCartTotal {
        private final Company company;
        private long productAmount;

        private CompanyCartTotal(Company company) {
            this.company = company;
        }

        private void add(long amount) {
            productAmount += amount;
        }

        private long shippingFee() {
            Long threshold = company.getFreeShippingThreshold();
            if (threshold != null && productAmount >= threshold) {
                return 0L;
            }
            return company.getBaseShippingFee();
        }
    }
}
