package kr.remerge.stylehub.domain.order.checkout.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import kr.remerge.stylehub.domain.cart.enumtype.CartType;

import java.util.List;

public record CartCheckoutRequest (

        @NotEmpty
        List<@NotNull @Positive Integer> cartItemIds,

        @NotNull
        CartType cartType
){
}
