package kr.remerge.stylehub.domain.quote.service;

import kr.remerge.stylehub.domain.quote.constant.QuoteStatusCode;
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

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuoteStatusService {

    private final UserReader userReader;
    private final QuoteRepository quoteRepository;

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
        }


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

            default -> false;
        };

        if (!allowed) {
            throw new BusinessException(ErrorCode.INVALID_QUOTE_STATUS);
        }


    }

    private void validateStatusChangeAuthority(User actor, Quote quote) {

        if (actor.getRole() == UserRole.ADMIN) {
            return;
        }

        boolean isBuyer = Objects.equals(
                quote.getBuyer().getUserId(),
                actor.getUserId()
        );

        if (!isBuyer) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
    }

}
