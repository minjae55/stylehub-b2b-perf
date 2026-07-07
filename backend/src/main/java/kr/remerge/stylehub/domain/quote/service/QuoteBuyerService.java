package kr.remerge.stylehub.domain.quote.service;

import kr.remerge.stylehub.domain.contract.entity.Contract;
import kr.remerge.stylehub.domain.contract.repository.ContractRepository;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.repository.OrderRepository;
import kr.remerge.stylehub.domain.quote.dto.QuoteBuyerListResponse;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.quote.repository.QuoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class QuoteBuyerService {

    private final QuoteRepository quoteRepository;
    private final OrderRepository orderRepository;
    private final ContractRepository contractRepository;

    public List<QuoteBuyerListResponse> getQuoteList(Integer userId) {
        List<Quote> quotes =
                quoteRepository.findByBuyer_UserIdOrderBySubmittedAtDesc(userId);

        if (quotes.isEmpty()) {
            return List.of();
        }

        // 재견적(v1→v2→...) 체인에서 다른 견적의 parentQuote로 참조되는(=대체된) 버전은
        // 별도 행으로 노출하지 않고, 체인의 최신 버전 하나만 목록에 보여준다.
        // (셀러가 재견적하면 이전 버전은 SUPERSEDED로 바뀌지만, 방어적으로 체인 관계로도 한 번 더 걸러낸다)
        Set<Integer> supersededQuoteIds = quotes.stream()
                .map(Quote::getParentQuote)
                .filter(Objects::nonNull)
                .map(Quote::getQuoteId)
                .collect(Collectors.toCollection(HashSet::new));

        List<Quote> latestQuotes = quotes.stream()
                .filter(quote -> !supersededQuoteIds.contains(quote.getQuoteId()))
                .toList();

        List<Integer> quoteIds = quotes.stream()
                .map(Quote::getQuoteId)
                .toList();

        // 샘플 주문/계약은 재견적 이전 버전(구 quoteId)에 걸려 있을 수 있으므로
        // 체인 전체 quoteId로 조회해두고, 각 최신 견적에서 체인을 거슬러 올라가며 찾는다.
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

        // 본주문(샘플이 아닌 실제 결제 주문)도 동일한 방식으로 조회한다.
        // 계약이 COMPLETED(양측 서명 완료)여도 결제가 안 됐을 수 있어서, "결제하러 가기" 버튼을
        // 계속 보여줄지 판단하려면 계약 상태만으로는 부족하고 실제 주문 존재 여부가 필요하다.
        List<Order> orders =
                orderRepository
                        .findByQuote_QuoteIdInAndBuyer_UserIdAndIsSampleFalseOrderByCreatedAtDesc(
                                quoteIds,
                                userId
                        );

        Map<Integer, Order> latestOrderByQuoteId = new HashMap<>();

        orders.forEach(order ->
                latestOrderByQuoteId.putIfAbsent(
                        order.getQuote().getQuoteId(),
                        order
                )
        );

        // 한 견적에 계약 버전이 여러 개(재계약) 있을 수 있으므로, 버전 내림차순으로 먼저
        // 처리해 최신 계약이 우선 저장되도록 한다. (DB가 조회 순서를 보장하지 않으므로
        // 정렬 없이 그냥 덮어쓰면 오래된/취소된 계약이 남을 수 있음)
        Map<Integer, Contract> contractByQuoteId = new HashMap<>();

        contractRepository.findByQuote_QuoteIdIn(quoteIds)
                .stream()
                .sorted(Comparator.comparing(Contract::getVersion).reversed())
                .forEach(contract ->
                        contractByQuoteId.putIfAbsent(
                                contract.getQuote().getQuoteId(),
                                contract
                        )
                );

        return latestQuotes
                .stream()
                .map(quote -> QuoteBuyerListResponse.from(
                        quote,
                        findInChain(quote, latestSampleOrderByQuoteId),
                        findInChain(quote, contractByQuoteId),
                        findInChain(quote, latestOrderByQuoteId)
                ))
                .toList();
    }

    // 체인의 최신 견적부터 시작해 parentQuote를 거슬러 올라가며 해당 quoteId에 연결된
    // 값(샘플 주문/계약 등)을 찾는다. 재견적으로 quoteId가 바뀌어도 이전 버전에 달려있던
    // 값을 최신 버전 행에서 그대로 보여주기 위함.
    private <T> T findInChain(Quote quote, Map<Integer, T> byQuoteId) {
        Quote current = quote;

        while (current != null) {
            T found = byQuoteId.get(current.getQuoteId());

            if (found != null) {
                return found;
            }

            current = current.getParentQuote();
        }

        return null;
    }
}
