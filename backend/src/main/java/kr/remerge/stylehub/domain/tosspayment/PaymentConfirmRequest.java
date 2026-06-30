package kr.remerge.stylehub.domain.tosspayment;

import java.util.List;

public record PaymentConfirmRequest(
        String paymentKey,
        String orderId,
        Long amount,
        List<String> orderIds
) {}
