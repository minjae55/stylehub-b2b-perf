package kr.remerge.stylehub.domain.dashboard.dto.seller;

import java.time.LocalDateTime;

public record SellerNegotiationDashboardResponse(Integer negotiationId, String title, String productName,
                                                 String buyerName, Integer qty, String lastMessage,
                                                 String lastMessageAt, Boolean hasNewMessage) {
    public SellerNegotiationDashboardResponse(Integer negotiationId, String title, String productName, String buyerName,
                                              Integer qty, String lastMessage, LocalDateTime lastMessageAt, Boolean hasNewMessage) {
        this.negotiationId = negotiationId;
        this.title = title;
        this.productName = productName;
        this.buyerName = buyerName;
        this.qty = qty;
        this.lastMessage = lastMessage;
        this.lastMessageAt = lastMessageAt != null ? lastMessageAt.toString() : null;
        this.hasNewMessage = hasNewMessage != null ? hasNewMessage : false;
    }
}