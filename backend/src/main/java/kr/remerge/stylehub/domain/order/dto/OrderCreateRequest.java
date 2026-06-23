package kr.remerge.stylehub.domain.order.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import kr.remerge.stylehub.domain.cart.enumtype.CartType;

import java.util.List;

public record OrderCreateRequest(

        @NotEmpty(message = "선택된 장바구니 상품이 없습니다.")
        List<Integer> cartItemIds,

        @NotNull(message = "배송지를 선택해주세요.")
        Integer addressId,

        @NotNull(message = "장바구니 타입이 올바르지 않습니다.")
        CartType cartType
        ) {
}
