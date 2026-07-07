package kr.remerge.stylehub.domain.dashboard.dto.seller;

import java.time.LocalDateTime;

/**
 * @param status "RECEIVED" | "UNDER_REVIEW" | "RESOLVED"
 */
public record SellerDisputeDashboardResponse(Integer disputeId, String title, String productName, String buyerName,
                                             String buyerClaim, String createdAt, String status) {
    public SellerDisputeDashboardResponse(Integer disputeId, String title, String productName, String buyerName,
                                          String buyerClaim, LocalDateTime createdAt, String status) {
        // 💡 핵심 수정: 레코드 필드 직접 할당 대신, 표준 생성자(this)로 값을 위임합니다.
        this(
                disputeId,
                title,
                productName,
                buyerName,
                buyerClaim,
                createdAt != null ? createdAt.toString() : null,
                status
        );
    }
}