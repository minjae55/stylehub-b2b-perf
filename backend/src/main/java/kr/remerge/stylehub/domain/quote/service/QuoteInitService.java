package kr.remerge.stylehub.domain.quote.service;

import kr.remerge.stylehub.domain.quote.dto.QuoteInitResponse;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequestItem;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestItemRepository;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QuoteInitService {

    private final SourcingRequestRepository sourcingRequestRepository;
    private final SourcingRequestItemRepository sourcingRequestItemRepository;

    @Transactional(readOnly = true)
    public QuoteInitResponse getQuoteInit(Integer sourcingId) {
        SourcingRequest request = sourcingRequestRepository.findById(sourcingId)
                .orElseThrow(() -> new IllegalArgumentException("소싱 요청을 찾을 수 없습니다."));

        List<SourcingRequestItem> items = sourcingRequestItemRepository.findBySourcingRequest_SourcingRequestId(sourcingId);

        return QuoteInitResponse.from(request, items);
    }
}
