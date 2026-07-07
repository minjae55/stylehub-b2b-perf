package kr.remerge.stylehub.domain.dashboard.dto.buyer;

/**
 * @param daysElapsed 배송 출발 후 경과 일수
 */
public record UrgentReceiptDashboardResponse(Integer orderId, String orderNo, String productName,
                                             String sellerCompanyName, Integer qty, Integer daysElapsed) {
}