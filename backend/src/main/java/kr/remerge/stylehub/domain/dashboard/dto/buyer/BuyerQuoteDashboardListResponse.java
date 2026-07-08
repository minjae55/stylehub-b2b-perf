package kr.remerge.stylehub.domain.dashboard.dto.buyer;

import java.util.List;

public record BuyerQuoteDashboardListResponse(
        long totalCount,                             // 대시보드 견적 카드용 전체 카운트
        List<BuyerQuoteDashboardResponse> list       // 하단 패널용 최신 5개 견적 리스트
) {
}