package kr.remerge.stylehub.domain.negotiation.dto;

import kr.remerge.stylehub.domain.negotiation.entity.Negotiation;
import kr.remerge.stylehub.domain.negotiation.entity.NegotiationRequest;
import kr.remerge.stylehub.domain.order.entity.Order;

import java.time.LocalDateTime;
import java.util.Map;

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
        Integer linkedNegotiationId,
        Integer sampleOrderId,
        String sampleOrderNo,
        String sampleOrderStatus
) {

    public static NegotiationListResponse from(
            Negotiation negotiation,
            Map<Integer, String> userNameById,
            NegotiationRequest latestRequest,
            Integer linkedNegotiationId,
            Order sampleOrder
    ) {

        return new NegotiationListResponse(
                negotiation.getNegotiationId(),
                negotiation.getNegotiationType(),
                negotiation.getBuyerId(),
                negotiation.getSellerId(),
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
                userNameById.get(negotiation.getBuyerId()),
                userNameById.get(negotiation.getSellerId()),
                negotiation.getAdminId() == null
                        ? null
                        : userNameById.get(negotiation.getAdminId()),
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
                linkedNegotiationId,
                sampleOrder == null ? null : sampleOrder.getOrderId(),
                sampleOrder == null ? null : sampleOrder.getOrderNo(),
                sampleOrder == null ? null : sampleOrder.getStatus().name()
        );
    }
}