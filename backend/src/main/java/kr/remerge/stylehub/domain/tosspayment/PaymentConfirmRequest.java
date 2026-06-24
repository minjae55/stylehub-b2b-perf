package kr.remerge.stylehub.domain.tosspayment;

public record PaymentConfirmRequest(
        String paymentKey,
        String orderId,     // 토스용 주문번호 (STYLEHUB...)
        Long amount,
        Integer realOrderId // 👈 우리 백엔드 orders 테이블의 PK (Integer)를 추가로 받습니다.
) {}
