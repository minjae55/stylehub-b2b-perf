package kr.remerge.stylehub.domain.negotiation.dto;

import kr.remerge.stylehub.domain.negotiation.entity.Negotiation;
import kr.remerge.stylehub.domain.negotiation.entity.NegotiationRequest;

import java.time.LocalDateTime;

public record NegotiationListResponse(

        Integer negotiationId,
        String negotiationType,
        Integer buyerId,
        Integer sellerId,
        Integer quoteId,
        Integer contractId,
        String quoteNo,
        String productName,
        String buyerName,
        String sellerName,
        String adminName,
        String status,
        String title,
        String latestRequest,
        Integer latestRequestId,
        String latestRequestStatus,
        LocalDateTime openedAt,
        LocalDateTime updatedAt,
        LocalDateTime agreedAt,
        LocalDateTime closedAt,
        // 같은 딜의 다른 타입(QUOTE<->CONTRACT) 협의가 있으면 그 negotiationId.
        // 화면에서 두 협의를 하나의 연속된 대화로 묶어 보여줄 때 사용한다.
        Integer linkedNegotiationId
) {

    public static NegotiationListResponse from(
            Negotiation negotiation,
            NegotiationRequest latestRequest,
            Integer linkedNegotiationId
    ) {

        return new NegotiationListResponse(
                negotiation.getNegotiationId(),
                negotiation.getNegotiationType(),
                negotiation.getBuyer().getUserId(),
                negotiation.getSeller().getUserId(),
                negotiation.getQuote() == null
                        ? null
                        : negotiation.getQuote().getQuoteId(),
                negotiation.getContract() == null
                        ? null
                        : negotiation.getContract().getContractId(),
                negotiation.getQuote() == null
                        ? null
                        : negotiation.getQuote().getQuoteNo(),
                negotiation.getQuote() == null
                        ? null
                        : negotiation.getQuote().getProductName(),
                negotiation.getBuyer().getName(),
                negotiation.getSeller().getName(),
                negotiation.getAdmin() == null
                        ? null
                        : negotiation.getAdmin().getName(),
                negotiation.getStatus(),
                negotiation.getTitle(),
                latestRequest == null
                        ? null
                        : latestRequest.getBuyerRequest(),
                latestRequest == null
                        ? null
                        : latestRequest.getNegotiationRequestId(),
                latestRequest == null
                        ? null
                        : latestRequest.getStatus(),
                negotiation.getOpenedAt(),
                negotiation.getUpdatedAt(),
                negotiation.getAgreedAt(),
                negotiation.getClosedAt(),
                linkedNegotiationId
        );
    }
}
