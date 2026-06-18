package kr.remerge.stylehub.domain.tosspayment;

public record PaymentConfirmRequest(String paymentKey, Integer orderId, Long amount) {}
