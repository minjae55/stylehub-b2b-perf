package kr.remerge.stylehub.domain.dashboard.dto.buyer;

import java.time.LocalDateTime;

/**
 * @param status OrderStatus 매핑용 문자열
 */
// 💡 핵심 수정 1: class 대신 record로 정확히 선언합니다.
public record BuyerOrderDashboardResponse(Integer orderId, String orderNo, String productName, String sellerCompanyName,
                                          Integer qty, Long totalAmount, String status, String confirmedAt,
                                          Boolean isDelayed, String carrier, String trackingNo) {

    // LocalDateTime을 받아 처리하는 커스텀 생성자
    public BuyerOrderDashboardResponse(Integer orderId, String orderNo, String productName, String sellerCompanyName,
                                       Integer qty, Long totalAmount, String status, LocalDateTime confirmedAt,
                                       Boolean isDelayed, String carrier, String trackingNo) {
        // 💡 핵심 수정 2: 필드 직접 할당(this.field = ...) 대신 표준 생성자(this(...))를 호출하여 값을 매핑합니다.
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