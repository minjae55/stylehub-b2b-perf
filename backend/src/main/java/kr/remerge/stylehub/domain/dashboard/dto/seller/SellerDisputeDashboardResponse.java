package kr.remerge.stylehub.domain.dashboard.dto.seller;

import java.time.LocalDateTime;

/**
 * @param status "RECEIVED" | "UNDER_REVIEW" | "RESOLVED"
 */
public record SellerDisputeDashboardResponse(Integer disputeId, String title, String productName, String buyerName,
                                             String buyerClaim, String createdAt, String status) {
    public SellerDisputeDashboardResponse(Integer disputeId, String title, String productName, String buyerName,
                                          String buyerClaim, LocalDateTime createdAt, String status) {
        this.disputeId = disputeId;
        this.title = title;
        this.productName = productName;
        this.buyerName = buyerName;
        this.buyerClaim = buyerClaim;
        this.createdAt = createdAt != null ? createdAt.toString() : null;
        this.status = status;
    }
}