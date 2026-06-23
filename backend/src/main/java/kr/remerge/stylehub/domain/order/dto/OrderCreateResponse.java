package kr.remerge.stylehub.domain.order.dto;

import java.util.List;

public record OrderCreateResponse(
        List<String> orderNos,
        Long totalAmount
) {
}
