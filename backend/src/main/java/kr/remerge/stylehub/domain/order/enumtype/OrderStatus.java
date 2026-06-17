package kr.remerge.stylehub.domain.order.enumtype;

public enum OrderStatus {
    PENDING, // 주문 생성 전/결제 대기 상태. 결제 완료 전이면 사용
    CONFIRMED, // 결제 완료로 주문이 확정된 상태
    PREPARING, // 셀러가 출고를 준비 중인 상태
    SHIPPED, //배송이 시작되어 송장번호가 등록된 상태
    DELIVERED, // 배송 완료 상태. 거래 확정 또는 이의제기 가능
    COMPLETED, //바이어가 거래를 확정한 상태. 정산 생성 대상
    DISPUTE, // 이의제기가 접수되어 처리 중인 상태
    CANCELED, //주문이 취소된 상태
    REFUNDED, // 환불 처리가 완료된 상태
}
