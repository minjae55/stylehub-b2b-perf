package kr.remerge.stylehub.domain.sourcing.enumtype;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

public enum SourcingStatus {
    // 대기중
    PENDING,
    // 거래중
    TRADING,
    // 협의중
    NEGOTIATING,
    //반려(소싱 전부 거절시)
    CANCELLED,
    // 완료
    COMPLETED
}