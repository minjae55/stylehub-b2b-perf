package kr.remerge.stylehub.domain.negotiation.service;

import kr.remerge.stylehub.domain.negotiation.cache.NegotiationListCache;
import kr.remerge.stylehub.domain.negotiation.dto.NegotiationListResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class NegotiationQueryFacade {

    private final NegotiationService negotiationService;
    private final NegotiationListCache cache;

    public List<NegotiationListResponse> getNegotiationList(Integer userId, int page, int size) {

        return cache.get(userId, page, size)
                .orElseGet(() -> {
                    List<NegotiationListResponse> result =
                            negotiationService.getNegotiationList(userId, page, size);
                    cache.put(userId, page, size, result);

                    return result;
                });
    }
}
