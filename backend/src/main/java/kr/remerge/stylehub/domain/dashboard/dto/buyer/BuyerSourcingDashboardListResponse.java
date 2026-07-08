package kr.remerge.stylehub.domain.dashboard.dto.buyer;

import java.util.List;

public record BuyerSourcingDashboardListResponse(
        long totalCount,
        List<BuyerSourcingDashboardResponse> list
) {
}