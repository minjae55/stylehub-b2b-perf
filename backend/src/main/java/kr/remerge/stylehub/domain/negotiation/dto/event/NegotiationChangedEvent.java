package kr.remerge.stylehub.domain.negotiation.dto.event;

public record NegotiationChangedEvent (
        Integer buyerId,
        Integer sellerId
){
}
