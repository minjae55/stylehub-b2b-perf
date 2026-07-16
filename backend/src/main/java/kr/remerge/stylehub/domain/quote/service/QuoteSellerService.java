package kr.remerge.stylehub.domain.quote.service;

import kr.remerge.stylehub.domain.contract.entity.Contract;
import kr.remerge.stylehub.domain.contract.enumtype.ContractStatus;
import kr.remerge.stylehub.domain.contract.repository.ContractRepository;
import kr.remerge.stylehub.domain.quote.dto.QuoteSellerListResponse;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.quote.repository.QuoteRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;
import kr.remerge.stylehub.domain.user.support.UserReader;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
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
public class QuoteSellerService {

    private final QuoteRepository quoteRepository;
    private final UserReader userReader;
    private final ContractRepository contractRepository;

    public List<QuoteSellerListResponse> getQuoteList(Integer userId) {

        User seller = userReader.getCompanyUser(userId);

        List<Quote> quotes;

        if (seller.getRole() == UserRole.PRESIDENT) {
            quotes =quoteRepository
                    .findByCompany_CompanyIdOrderBySubmittedAtDesc(
                            seller.getCompany().getCompanyId()
                    );
        } else if (seller.getRole() == UserRole.EMPLOYEE) {
            quotes = quoteRepository
                    .findBySeller_UserIdOrderBySubmittedAtDesc(userId);
        } else {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        // 재견적 체인에서 다른 견적의 parentQuote로 참조되는(=대체된) 버전은 별도 행으로
        // 노출하지 않고 체인의 최신 버전만 목록에 보여준다. (바이어 쪽과 동일한 이유)
        Set<Integer> supersededQuoteIds = quotes.stream()
                .map(Quote::getParentQuote)
                .filter(Objects::nonNull)
                .map(Quote::getQuoteId)
                .collect(Collectors.toCollection(HashSet::new));

        List<Quote> latestQuotes = quotes.stream()
                .filter(quote -> !supersededQuoteIds.contains(quote.getQuoteId()))
                .toList();

       List<Integer> quoteIds =  quotes.stream()
                .map(Quote::getQuoteId)
                .toList();

        List<Contract> contracts =
                contractRepository.findByQuote_QuoteIdIn(
                        quoteIds
                );

        // 한 견적에 계약 버전이 여러 개(재계약) 있을 수 있으므로, 버전 내림차순으로 먼저
        // 처리해 최신 계약 상태가 우선 저장되도록 한다. (바이어 쪽과 동일한 이유)
        contracts.sort(Comparator.comparing(Contract::getVersion).reversed());

        Map<Integer, ContractStatus> contractStatusByQuoteId =
                new HashMap<>();


        for (Contract contract : contracts) {

            Integer quoteId
                    = contract.getQuote().getQuoteId();

            ContractStatus contractStatus
                    = contract.getStatus();

            contractStatusByQuoteId.putIfAbsent(
                    quoteId,
                    contractStatus
            );
        }

        return latestQuotes.stream()
                .map(quote ->
                        QuoteSellerListResponse.from(
                                quote,
                                findContractStatusInChain(quote, contractStatusByQuoteId)
                        )
                )
                .toList();

    }

    // 계약도 재견적 이전 버전 quoteId에 걸려있을 수 있으므로 체인을 거슬러 올라가며 찾는다.
    private ContractStatus findContractStatusInChain(
            Quote quote,
            Map<Integer, ContractStatus> contractStatusByQuoteId
    ) {
        Quote current = quote;

        while (current != null) {
            ContractStatus found = contractStatusByQuoteId.get(current.getQuoteId());

            if (found != null) {
                return found;
            }

            current = current.getParentQuote();
        }

        return null;
    }

}
