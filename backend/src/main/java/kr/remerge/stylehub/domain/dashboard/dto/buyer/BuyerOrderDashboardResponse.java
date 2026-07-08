package kr.remerge.stylehub.domain.dashboard.dto.buyer;

import java.time.LocalDateTime;

/**
 * @param status OrderStatus 매핑용 문자열
 */
public record BuyerOrderDashboardResponse(Integer orderId, String orderNo, String productName, String sellerCompanyName,
                                          Integer qty, Long totalAmount, String status, String confirmedAt,
                                          Boolean isDelayed, String carrier, String trackingNo) {

    // LocalDateTime을 받아 처리하는 커스텀 생성자
    public BuyerOrderDashboardResponse(Integer orderId, String orderNo, String productName, String sellerCompanyName,
                                       Integer qty, Long totalAmount, String status, LocalDateTime confirmedAt,
                                       Boolean isDelayed, String carrier, String trackingNo) {
        this(
                orderId,
                orderNo,
                productName,
                sellerCompanyName,
                qty,
                totalAmount,
                status,
                confirmedAt != null ? confirmedAt.toString() : null,
                isDelayed != null ? isDelayed : false,
                carrier,
                trackingNo
        );
    }
}