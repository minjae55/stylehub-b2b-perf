package kr.remerge.stylehub.domain.quote.service;

import kr.remerge.stylehub.domain.quote.dto.QuoteBuyerListResponse;
import kr.remerge.stylehub.domain.quote.repository.QuoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class QuoteBuyerService {

    private final QuoteRepository quoteRepository;

    public List<QuoteBuyerListResponse> getQuoteList(Integer userId) {
        return quoteRepository
                .findByBuyer_UserIdOrderBySubmittedAtDesc(userId)
                .stream()
                .map(QuoteBuyerListResponse::from)
                .toList();
    }
}
