package kr.remerge.stylehub.domain.cart.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import kr.remerge.stylehub.domain.cart.enumtype.CartType;

public record CartAddRequest(

        @NotNull
        Integer productOptionId,

        @NotNull
        @Min(1)
        Integer quantity,

        @NotNull
        CartType cartType
) {
}
