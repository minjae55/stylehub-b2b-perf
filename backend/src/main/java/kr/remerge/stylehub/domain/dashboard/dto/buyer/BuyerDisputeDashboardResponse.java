package kr.remerge.stylehub.domain.dashboard.dto.buyer;

import java.time.LocalDateTime;

/**
 * @param status "RECEIVED" | "UNDER_REVIEW" | "RESOLVED"
 */
public record BuyerDisputeDashboardResponse(Integer disputeId, String productName, String sellerCompanyName,
                                            String title, String disputeType, String reason, String status,
                                            String createdAt) {

    public BuyerDisputeDashboardResponse(Integer disputeId, String productName, String sellerCompanyName,
                                         String title, String disputeType, String reason, String status, LocalDateTime createdAt) {
        this(
                disputeId,
                productName,
                sellerCompanyName,
                title,
                disputeType,
                reason,
                status,
                createdAt != null ? createdAt.toString() : null
        );
    }
}