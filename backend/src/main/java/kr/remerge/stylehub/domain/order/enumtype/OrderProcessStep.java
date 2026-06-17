package kr.remerge.stylehub.domain.order.enumtype;

public enum OrderProcessStep {
    SAMPLE_PREPARING,   // 샘플 준비 또는 제작이 시작된 단계
    SAMPLE_SHIPPED,     // 샘플이 발송된 단계
    SAMPLE_DELIVERED,   // 샘플이 바이어에게 도착한 단계
    SAMPLE_NEGOTIATING, // 샘플 확인 후 수정 요청 또는 재협의가 진행 중인 단계
    CONTRACT_SIGNING,   // 소싱 주문에서 계약서 서명이 진행 중인 단계
    CONTRACT_CONFIRMED, // 셀러/바이어 서명이 완료되어 계약이 확정된 단계

    PRODUCTION_STARTED, // 소싱 주문의 본생산이 시작된 단계
    PRODUCTION_COMPLETED // 소싱 주문의 본생산이 완료된 단계
}
