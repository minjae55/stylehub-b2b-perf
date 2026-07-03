package kr.remerge.stylehub.domain.order.checkout.dto;

import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.quote.entity.QuoteItem;

public record SampleCheckoutItemResponse(
        Integer quoteItemId,
        String productName,
        String optionSummary,
        Integer quantity,
        Long unitPrice,
        Long totalPrice
) {

    public static SampleCheckoutItemResponse from(
            Quote quote,
            QuoteItem item
    ) {
        return new SampleCheckoutItemResponse(
                item.getQuoteItemId(),
                quote.getProductName(),
                item.getOptionSummary(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getTotalPrice()
        );
    }
}
