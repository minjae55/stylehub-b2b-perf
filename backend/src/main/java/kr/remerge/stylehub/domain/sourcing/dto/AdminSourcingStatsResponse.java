package kr.remerge.stylehub.domain.sourcing.dto;

import lombok.Builder;
import lombok.Getter;

// 관리자 - 전체 소싱 요청 그룹별 통계 (BuyerSourcingCounts와 동일한 그룹 기준)
// active: PENDING+QUOTED+NEGOTIATING, trading: TRADING, completed: COMPLETED, closed: CANCELLED+WITHDRAWN+EXPIRED
@Getter
@Builder
public class AdminSourcingStatsResponse {
    private long all;
    private long active;
    private long trading;
    private long completed;
    private long closed;
}
