package kr.remerge.stylehub.domain.dashboard.dto.buyer;

import java.time.LocalDateTime;

public record BuyerNegotiationDashboardResponse(Integer negotiationId, String productName, String sellerCompanyName,
                                                Integer qty, String title, String status, String lastMessage,
                                                String updatedAt, Boolean hasUnread) {
    public BuyerNegotiationDashboardResponse(Integer negotiationId, String productName, String sellerCompanyName,
                                             Integer qty, String title, String status, String lastMessage,
                                             LocalDateTime updatedAt, Boolean hasUnread) {
        this.negotiationId = negotiationId;
        this.productName = productName;
        this.sellerCompanyName = sellerCompanyName;
        this.qty = qty;
        this.title = title;
        this.status = status;
        this.lastMessage = lastMessage;
        this.updatedAt = updatedAt != null ? updatedAt.toString() : null;
        this.hasUnread = hasUnread != null ? hasUnread : false;
    }
}