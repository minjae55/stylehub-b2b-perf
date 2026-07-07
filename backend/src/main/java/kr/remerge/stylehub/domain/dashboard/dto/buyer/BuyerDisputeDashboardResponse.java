package kr.remerge.stylehub.domain.dashboard.dto.buyer;

import java.time.LocalDateTime;

/**
 * @param status "RECEIVED" | "UNDER_REVIEW" | "RESOLVED"
 */
public record BuyerDisputeDashboardResponse(Integer disputeId, String productName, String sellerCompanyName,
                                            String title, String disputeType, String reason, String status,
                                            String createdAt) {

    // LocalDateTime을 받아 String으로 변환 처리하는 커스텀 생성자
    public BuyerDisputeDashboardResponse(Integer disputeId, String productName, String sellerCompanyName,
                                         String title, String disputeType, String reason, String status, LocalDateTime createdAt) {
        // 💡 핵심 수정: 레코드 필드에 직접 대입하는 대신, 표준 생성자 this(...)를 첫 줄에 호출하여 값을 매핑합니다.
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