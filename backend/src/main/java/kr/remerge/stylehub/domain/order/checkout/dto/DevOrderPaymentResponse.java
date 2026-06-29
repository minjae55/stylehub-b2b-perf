package kr.remerge.stylehub.domain.order.checkout.dto;

import java.util.List;

public record DevOrderPaymentResponse(
        List<String> orderNos,
        Long totalAmount
) {
}
