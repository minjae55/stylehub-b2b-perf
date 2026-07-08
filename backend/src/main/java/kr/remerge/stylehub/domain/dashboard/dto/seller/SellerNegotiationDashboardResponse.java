package kr.remerge.stylehub.domain.dashboard.dto.seller;

import java.time.LocalDateTime;

public record SellerNegotiationDashboardResponse(Integer negotiationId, String title, String productName,
                                                 String buyerName, Integer qty, String lastMessage,
                                                 String lastMessageAt, Boolean hasNewMessage) {
    public SellerNegotiationDashboardResponse(Integer negotiationId, String title, String productName, String buyerName,
                                              Integer qty, String lastMessage, LocalDateTime lastMessageAt, Boolean hasNewMessage) {
        this(negotiationId, title, productName, buyerName, qty, lastMessage, lastMessageAt != null ? lastMessageAt.toString() : null, hasNewMessage != null ? hasNewMessage : false);
    }
}