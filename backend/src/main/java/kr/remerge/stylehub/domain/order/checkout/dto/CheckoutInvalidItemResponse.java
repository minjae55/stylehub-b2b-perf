package kr.remerge.stylehub.domain.order.checkout.dto;

public record CheckoutInvalidItemResponse(
        Integer cartItemId,
        String productName,
        String optionLabel,
        String reasonCode,
        String message,
        Integer requestedQuantity,
        Integer availableQuantity
) {
}
