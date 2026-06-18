package kr.remerge.stylehub.domain.tosspayment.enumtype;

public enum PaymentStatus {
    READY,      // 결제 준비
    IN_PROGRESS,// 결제 진행 중
    DONE,       // 결제 완료
    CANCELED,   // 결제 취소
    EXPIRED     // 결제 시간 만료
};