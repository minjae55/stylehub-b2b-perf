package kr.remerge.stylehub.domain.quote.service;

import kr.remerge.stylehub.domain.negotiation.entity.Negotiation;
import kr.remerge.stylehub.domain.negotiation.repository.NegotiationRepository;
import kr.remerge.stylehub.domain.quote.constant.QuoteStatusCode;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.quote.repository.QuoteRepository;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingStatus;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;
import kr.remerge.stylehub.domain.user.support.UserReader;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Set;
import java.util.function.Consumer;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuoteStatusService {

    private final UserReader userReader;
    private final QuoteRepository quoteRepository;
    private final NegotiationRepository negotiationRepository;

    @Transactional
    public void updateStatus(Integer userId, Integer quoteId, String newStatus) {

        User actor = userReader.getUser(userId);

        Quote quote = quoteRepository.findById(quoteId)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.QUOTE_NOT_FOUND)
                );

        validateStatusChangeAuthority(actor, quote);
        validateStatusTransition(quote.getStatus(), newStatus);
        validateQuoteExpiration(quote);

        quote.changeStatus(newStatus);

        if (QuoteStatusCode.APPROVED.equals(newStatus)) {
            rejectOtherQuotes(quote);
            quote.getSourcingRequest().trade();
            syncNegotiationOnQuoteConcluded(quote, Negotiation::agree);
        } else if (QuoteStatusCode.REJECTED.equals(newStatus)) {
            syncNegotiationOnQuoteConcluded(quote, Negotiation::close);
        }

    }

    // 바이어가 협의(재협의) 화면을 거치지 않고 견적 상세에서 바로 "채택하기/거절하기"를
    // 누르는 경우가 있는데, 이때 이 견적과 연결된 협의(Negotiation)가 OPEN 상태로 남아있으면
    // 협의 관리 화면에 결과가 전혀 반영되지 않는 문제가 있었다. 견적이 채택/거절되어 결론이 나면
    // 그 딜의 협의도 같이 종료 처리해준다. (협의가 아예 없었던 딜이면 조회 결과가 없어 아무 일도
    // 하지 않는다)
    private void syncNegotiationOnQuoteConcluded(
            Quote quote,
            Consumer<Negotiation> conclude
    ) {

        Quote rootQuote = resolveRootQuote(quote);

        negotiationRepository
                .findFirstByQuote_QuoteIdAndBuyer_UserIdOrderByOpenedAtDesc(
                        rootQuote.getQuoteId(),
                        quote.getBuyer().getUserId()
                )
                .filter(negotiation -> "OPEN".equals(negotiation.getStatus()))
                .ifPresent(conclude);
    }

    // parentQuote를 타고 올라가 이 견적 체인의 최초(v1) 견적을 찾는다. 협의(Negotiation)는
    // 항상 체인의 루트 견적을 기준으로 저장되기 때문에, 지금 채택/거절된 버전이 v2/v3이어도
    // 루트를 기준으로 협의를 찾아야 한다.
    private Quote resolveRootQuote(Quote quote) {
        Quote current = quote;

        while (current.getParentQuote() != null) {
            current = current.getParentQuote();
        }

        return current;
    }

    private void rejectOtherQuotes(Quote approvedQuote) {

        Integer sourcingRequestId = approvedQuote.getSourcingRequest()
                .getSourcingRequestId();

        quoteRepository.findBySourcingRequest_SourcingRequestIdAndQuoteIdNot(
                        sourcingRequestId,
                        approvedQuote.getQuoteId()
                )
                .stream()
                .filter(quote ->
                        QuoteStatusCode.SUBMITTED.equals(quote.getStatus())
                                || QuoteStatusCode.NEGOTIATING.equals(quote.getStatus())
                                || QuoteStatusCode.SAMPLE_REQUESTED.equals(quote.getStatus())
                )
                .forEach(quote ->
                        quote.changeStatus(QuoteStatusCode.NOT_SELECTED));
    }

    private void validateQuoteExpiration(Quote quote) {

        if (quote.getValidUntil().isBefore(LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.QUOTE_EXPIRED);
        }
    }

    private void validateStatusTransition(String currentStatus, String newStatus) {

        boolean allowed = switch (currentStatus) {

            case QuoteStatusCode.SUBMITTED ->
                    Set.of(
                            QuoteStatusCode.APPROVED,
                            QuoteStatusCode.REJECTED,
                            QuoteStatusCode.NEGOTIATING,
                            QuoteStatusCode.SAMPLE_REQUESTED
                    ).contains(newStatus);

            case QuoteStatusCode.SAMPLE_REQUESTED -> Set.of(
                    QuoteStatusCode.APPROVED,
                    QuoteStatusCode.REJECTED
            ).contains(newStatus);

            case QuoteStatusCode.NEGOTIATING ->
                    Set.of(
                            QuoteStatusCode.APPROVED,
                            QuoteStatusCode.REJECTED,
                            QuoteStatusCode.SAMPLE_REQUESTED
                    ).contains(newStatus);

            default -> false;
        };

        if (!allowed) {
            throw new BusinessException(ErrorCode.INVALID_QUOTE_STATUS);
        }
    }

    // 액션(상태 변경) 권한: 관리자 / 견적을 요청한 바이어 본인 / 바이어 회사 대표
    // (조회 쪽 validateQuoteAccess와 셀러측 "본인+대표" 패턴을 바이어측에도 대칭 적용)
    private void validateStatusChangeAuthority(User actor, Quote quote) {

        if (actor.getRole() == UserRole.ADMIN) {
            return;
        }

        boolean isBuyer = Objects.equals(
                quote.getBuyer().getUserId(),
                actor.getUserId()
        );

        boolean isBuyerCompanyPresident =
                actor.getRole() == UserRole.PRESIDENT
                        && actor.getCompany() != null
                        && Objects.equals(
                        quote.getBuyer().getCompany().getCompanyId(),
                        actor.getCompany().getCompanyId()
                );

        if (!isBuyer && !isBuyerCompanyPresident) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
    }

}