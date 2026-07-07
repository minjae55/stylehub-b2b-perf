package kr.remerge.stylehub.domain.dashboard.dto.buyer;

import java.time.LocalDateTime;

/**
 * @param status OrderStatus 매핑용 문자열
 */
public record BuyerOrderDashboardResponse(Integer orderId, String orderNo, String productName, String sellerCompanyName,
                                          Integer qty, Long totalAmount, String status, String confirmedAt,
                                          Boolean isDelayed, String carrier, String trackingNo) {
    public BuyerOrderDashboardResponse(Integer orderId, String orderNo, String productName, String sellerCompanyName,
                                       Integer qty, Long totalAmount, String status, LocalDateTime confirmedAt,
                                       Boolean isDelayed, String carrier, String trackingNo) {
        this.orderId = orderId;
        this.orderNo = orderNo;
        this.productName = productName;
        this.sellerCompanyName = sellerCompanyName;
        this.qty = qty;
        this.totalAmount = totalAmount;
        this.status = status;
        this.confirmedAt = confirmedAt != null ? confirmedAt.toString() : null;
        this.isDelayed = isDelayed != null ? isDelayed : false;
        this.carrier = carrier;
        this.trackingNo = trackingNo;
    }
}