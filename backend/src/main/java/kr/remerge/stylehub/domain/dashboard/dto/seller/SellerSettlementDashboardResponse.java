package kr.remerge.stylehub.domain.dashboard.dto.seller;

import java.time.LocalDateTime;

public record SellerSettlementDashboardResponse(Integer settlementId, String orderNo, String productName,
                                                String buyerName, Integer qty, Long grossAmount, Long platformFee,
                                                Long finalAmount, String confirmedAt) {
    public SellerSettlementDashboardResponse(Integer settlementId, String orderNo, String productName, String buyerName,
                                             Integer qty, Long grossAmount, Long platformFee, Long finalAmount, LocalDateTime confirmedAt) {
        this.settlementId = settlementId;
        this.orderNo = orderNo;
        this.productName = productName;
        this.buyerName = buyerName;
        this.qty = qty;
        this.grossAmount = grossAmount;
        this.platformFee = platformFee;
        this.finalAmount = finalAmount;
        this.confirmedAt = confirmedAt != null ? confirmedAt.toString() : null;
    }
}