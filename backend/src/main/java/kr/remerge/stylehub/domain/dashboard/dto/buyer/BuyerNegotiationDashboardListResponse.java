package kr.remerge.stylehub.domain.dashboard.dto.buyer;

import java.util.List;

public record BuyerNegotiationDashboardListResponse(
        long totalCount,                                // 대시보드 협의 카드용 전체 카운트
        List<BuyerNegotiationDashboardResponse> list    // 하단 패널용 최신 5개 협의 리스트
) {
}