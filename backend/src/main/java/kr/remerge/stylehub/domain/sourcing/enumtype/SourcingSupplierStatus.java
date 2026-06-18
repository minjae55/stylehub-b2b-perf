package kr.remerge.stylehub.domain.sourcing.enumtype;

public enum SourcingSupplierStatus {
    SUGGESTED,   // 관리자가 후보로 등록만 한 상태
    RECOMMENDED, // 관리자 승인 → 셀러에게 노출
    QUOTED,      // 셀러가 견적 제출
    DECLINED,    // 셀러가 거절
    EXPIRED      // 기간 만료
}