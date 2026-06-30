package kr.remerge.stylehub.domain.tosspayment;

import java.util.List;

// 결제 승인 결과 응답
public record PaymentResponse(String paymentKey, String orderId, String status) {}

