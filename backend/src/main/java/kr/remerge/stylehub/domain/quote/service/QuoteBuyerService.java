package kr.remerge.stylehub.domain.quote.service;

import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.repository.OrderRepository;
import kr.remerge.stylehub.domain.quote.dto.QuoteBuyerListResponse;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.quote.repository.QuoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class QuoteBuyerService {

    private final QuoteRepository quoteRepository;
    private final OrderRepository orderRepository;

    public List<QuoteBuyerListResponse> getQuoteList(Integer userId) {
        List<Quote> quotes =
                quoteRepository.findByBuyer_UserIdOrderBySubmittedAtDesc(userId);

        if (quotes.isEmpty()) {
            return List.of();
        }

        List<Integer> quoteIds = quotes.stream()
                .map(Quote::getQuoteId)
                .toList();

        List<Order> sampleOrders =
                orderRepository
                        .findByQuote_QuoteIdInAndBuyer_UserIdAndIsSampleTrueOrderByCreatedAtDesc(
                                quoteIds,
                                userId
                        );

        Map<Integer, Order> latestSampleOrderByQuoteId = new HashMap<>();

        sampleOrders.forEach(order ->
                latestSampleOrderByQuoteId.putIfAbsent(
                        order.getQuote().getQuoteId(),
                        order
                )
        );

        return quotes
                .stream()
                .map(quote -> QuoteBuyerListResponse.from(
                        quote,
                        latestSampleOrderByQuoteId.get(quote.getQuoteId())
                ))
                .toList();
    }
}
