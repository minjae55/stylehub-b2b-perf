package kr.remerge.stylehub.domain.order.checkout.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record OrderCheckoutRequest(

        @NotEmpty
        List<@NotNull Integer> orderIds
) {
}
