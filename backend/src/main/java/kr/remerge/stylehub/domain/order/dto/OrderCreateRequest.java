package kr.remerge.stylehub.domain.order.dto;

import kr.remerge.stylehub.domain.cart.enumtype.CartType;

import java.util.List;

public record OrderCreateRequest(
        List<Integer> cartItemIds,
        Integer addressId,
        CartType cartType
) {
}
