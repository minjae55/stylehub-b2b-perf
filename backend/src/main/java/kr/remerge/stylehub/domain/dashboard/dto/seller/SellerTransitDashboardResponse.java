package kr.remerge.stylehub.domain.dashboard.dto.seller;

/**
 * @param status OrderStatus 매핑용 문자열
 */
public record SellerTransitDashboardResponse(Integer orderId, String productName, String buyerName, String status) {
}