package kr.remerge.stylehub.domain.negotiation.cache;

import kr.remerge.stylehub.domain.negotiation.dto.event.NegotiationChangedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class NegotiationCacheEvictListener  {

    private final NegotiationListCache cache;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onChanged(NegotiationChangedEvent event) {
        cache.evict(event.buyerId(), event.sellerId());
    }

}
