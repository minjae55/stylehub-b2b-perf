package kr.remerge.stylehub.domain.dashboard.dto.seller;

import java.time.LocalDateTime;

public record SellerSettlementDashboardResponse(Integer settlementId, String orderNo, String productName,
                                                String buyerName, Integer qty, Long grossAmount, Long platformFee,
                                                Long finalAmount, String confirmedAt) {
    public SellerSettlementDashboardResponse(Integer settlementId, String orderNo, String productName, String buyerName,
                                             Integer qty, Long grossAmount, Long platformFee, Long finalAmount, LocalDateTime confirmedAt) {
        // 💡 핵심 수정: 레코드 필드 직접 할당 대신, 표준 생성자(this)로 값을 위임 호출합니다.
        this(
                settlementId,
                orderNo,
                productName,
                buyerName,
                qty,
                grossAmount,
                platformFee,
                finalAmount,
                confirmedAt != null ? confirmedAt.toString() : null
        );
    }
}