package kr.remerge.stylehub.domain.order.checkout.dto;

import java.util.List;

public record CheckoutValidationErrorResponse(
        List<CheckoutInvalidItemResponse> invalidItems
) {
}
