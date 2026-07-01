package kr.remerge.stylehub.domain.sourcing.enumtype;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

public enum SourcingStatus {
    // 대기중 (공급사 배정 후 견적 대기)
    PENDING,
    // 견적수신 (공급사가 견적 제출)
    QUOTED,
    // 협의중
    NEGOTIATING,
    // 거래중
    TRADING,
    // 완료
    COMPLETED,
    // 반려 (모든 공급사 거절 시 자동)
    CANCELLED,
    // 취소 (buyer 직접 취소)
    WITHDRAWN
}