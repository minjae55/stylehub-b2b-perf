package kr.remerge.stylehub.domain.dashboard.dto.seller;

import java.time.LocalDateTime;

public record SellerSettlementDashboardResponse(Integer settlementId, String orderNo, String productName,
                                                String buyerName, Integer qty, Long grossAmount, Long platformFee,
                                                Long finalAmount, String confirmedAt) {
    public SellerSettlementDashboardResponse(Integer settlementId, String orderNo, String productName, String buyerName,
                                             Integer qty, Long grossAmount, Long platformFee, Long finalAmount, LocalDateTime confirmedAt) {
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