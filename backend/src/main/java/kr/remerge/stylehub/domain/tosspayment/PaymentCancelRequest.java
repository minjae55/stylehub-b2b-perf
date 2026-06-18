package kr.remerge.stylehub.domain.tosspayment;

public record PaymentCancelRequest(
        String cancelReason // 취소 사유
) {}
