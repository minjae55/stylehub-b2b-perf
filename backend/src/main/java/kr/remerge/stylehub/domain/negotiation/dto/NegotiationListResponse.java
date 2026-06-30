package kr.remerge.stylehub.domain.negotiation.dto;

import kr.remerge.stylehub.domain.negotiation.entity.Negotiation;
import kr.remerge.stylehub.domain.user.entity.User;

import java.time.LocalDateTime;

public record NegotiationListResponse(

        Integer negotiationId,
        String negotiationType,
        User buyer,
        User seller,
        User admin,
        String status,
        String title,
        LocalDateTime openedAt,
        LocalDateTime agreedAt,
        LocalDateTime closedAt
) {

    public static NegotiationListResponse from(Negotiation negotiation) {

        return new NegotiationListResponse(
                negotiation.getNegotiationId(),
                negotiation.getNegotiationType(),
                negotiation.getBuyer(),
                negotiation.getSeller(),
                negotiation.getAdmin(),
                negotiation.getStatus(),
                negotiation.getTitle(),
                negotiation.getOpenedAt(),
                negotiation.getAgreedAt(),
                negotiation.getClosedAt()
        );
    }
}
