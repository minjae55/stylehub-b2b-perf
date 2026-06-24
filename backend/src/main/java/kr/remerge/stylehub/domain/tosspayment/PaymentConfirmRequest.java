package kr.remerge.stylehub.domain.tosspayment;

public record PaymentConfirmRequest(
        String paymentKey,
        String orderId,
        Long amount
) {}
