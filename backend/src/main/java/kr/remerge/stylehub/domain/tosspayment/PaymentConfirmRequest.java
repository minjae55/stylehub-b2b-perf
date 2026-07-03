package kr.remerge.stylehub.domain.tosspayment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record PaymentConfirmRequest(
        @NotBlank
        String paymentKey,

        @NotBlank
        String orderId,

        @NotNull
        @Positive
        Long amount,

        @NotEmpty
        List<@NotBlank String> orderIds
) {}
