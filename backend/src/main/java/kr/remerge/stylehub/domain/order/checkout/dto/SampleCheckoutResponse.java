package kr.remerge.stylehub.domain.order.checkout.dto;

import kr.remerge.stylehub.domain.quote.entity.Quote;

import java.util.List;

public record SampleCheckoutResponse(
        Integer quoteId,
        String quoteNo,
        List<SampleCheckoutItemResponse> items,
        Long productAmount,
        Long shippingFee,
        Long totalAmount
) {
    public static SampleCheckoutResponse of(Quote buyerQuote, List<SampleCheckoutItemResponse> itemResponses, long productAmount, long shippingFee, long totalAmount) {

        return new SampleCheckoutResponse(
                buyerQuote.getQuoteId(),
                buyerQuote.getQuoteNo(),
                itemResponses,
                productAmount,
                shippingFee,
                totalAmount
        );
    }
}
