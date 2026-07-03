package kr.remerge.stylehub.domain.order.checkout.service;

import kr.remerge.stylehub.domain.order.checkout.dto.SampleCheckoutItemResponse;
import kr.remerge.stylehub.domain.order.checkout.dto.SampleCheckoutResponse;
import kr.remerge.stylehub.domain.quote.constant.QuoteStatusCode;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.quote.entity.QuoteItem;
import kr.remerge.stylehub.domain.quote.repository.QuoteItemRepository;
import kr.remerge.stylehub.domain.quote.repository.QuoteRepository;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static kotlin.text.Typography.quote;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SampleCheckoutService {

    private static final String SAMPLE_AVAILABLE = "AVAILABLE";

    private final QuoteRepository quoteRepository;
    private final QuoteItemRepository quoteItemRepository;

    public SampleCheckoutResponse getSampleCheckout(Integer userId, Integer quoteId) {

        Quote buyerQuote = findBuyerQuote(userId, quoteId);

        validateSampleCheckout(buyerQuote);

        List<QuoteItem> sampleItems =
                quoteItemRepository
                        .findByQuote_QuoteIdAndIsSampleTrue(quoteId);

        if (sampleItems.isEmpty()) {
            throw new BusinessException(ErrorCode.QUOTE_SAMPLE_ITEM_NOT_FOUND);
        }

        List<SampleCheckoutItemResponse> itemResponses =
                sampleItems.stream()
                .map(item ->
                        SampleCheckoutItemResponse.from(buyerQuote, item))
                .toList();

        long productAmount = sampleItems.stream()
                .mapToLong(QuoteItem::getTotalPrice)
                .sum();

        long shippingFee = buyerQuote.getShippingFee();
        long totalAmount = productAmount + shippingFee;

        return SampleCheckoutResponse.of(
                buyerQuote,
                itemResponses,
                productAmount,
                shippingFee,
                totalAmount
        );

    }

    private void validateSampleCheckout(Quote buyerQuote) {

        if (!QuoteStatusCode.SAMPLE_REQUESTED.equals(
                buyerQuote.getStatus()
        )) {
            throw new BusinessException(ErrorCode.INVALID_QUOTE_STATUS);
        }

        if (!SAMPLE_AVAILABLE.equals(
                buyerQuote.getSampleAvailable()
        )) {
            throw new BusinessException(ErrorCode.QUOTE_SAMPLE_NOT_AVAILABLE);
        }

        if (buyerQuote.getValidUntil().isBefore(
                LocalDateTime.now()
        )) {
            throw new BusinessException(ErrorCode.QUOTE_EXPIRED);
        }
    }

    private Quote findBuyerQuote(Integer userId, Integer quoteId) {

        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        if (quoteId == null) {
            throw new BusinessException(ErrorCode.QUOTE_NOT_FOUND);
        }

        return quoteRepository
                .findByQuoteIdAndBuyer_UserId(quoteId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.QUOTE_NOT_FOUND));
    }
}
