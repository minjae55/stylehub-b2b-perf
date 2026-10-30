package kr.remerge.stylehub.domain.negotiation.cache;

import kr.remerge.stylehub.domain.negotiation.dto.event.NegotiationChangedEvent;
import kr.remerge.stylehub.domain.negotiation.service.NegotiationQueryFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class NegotiationCacheEvictListener  {

    private final NegotiationListCache cache;
    private final NegotiationQueryFacade facade;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onChanged(NegotiationChangedEvent event) {
        cache.evict(event.buyerId(), event.sellerId());
        try {
            facade.getNegotiationList(event.buyerId(), 0, 20);
            facade.getNegotiationList(event.sellerId(), 0, 20);
        } catch (Exception e) {
            log.warn("협의 목록 재적재 실패", e);
        }
    }

}
