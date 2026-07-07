package kr.remerge.stylehub.domain.dashboard.dto.buyer;

import java.time.LocalDateTime;

public record BuyerNegotiationDashboardResponse(Integer negotiationId, String productName, String sellerCompanyName,
                                                Integer qty, String title, String status, String lastMessage,
                                                String updatedAt, Boolean hasUnread) {
    public BuyerNegotiationDashboardResponse(Integer negotiationId, String productName, String sellerCompanyName,
                                             Integer qty, String title, String status, String lastMessage,
                                             LocalDateTime updatedAt, Boolean hasUnread) {
        this(negotiationId, productName, sellerCompanyName, qty, title, status, lastMessage, updatedAt != null ? updatedAt.toString() : null, hasUnread != null ? hasUnread : false);
    }
}