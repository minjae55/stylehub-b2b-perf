package kr.remerge.stylehub.domain.order.checkout.dto;

import kr.remerge.stylehub.domain.cart.dto.CartResponse;
import kr.remerge.stylehub.domain.cart.enumtype.CartType;

import java.util.List;

public record CheckoutResponse(
        CartType cartType,
        List<CartResponse> items,
        Long productAmount,
        Long shippingFee,
        Long totalAmount
) {
}
