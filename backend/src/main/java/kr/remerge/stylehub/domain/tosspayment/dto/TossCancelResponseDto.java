package kr.remerge.stylehub.domain.tosspayment.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TossCancelResponseDto(
        String paymentKey,
        String orderId,
        String status,   // CANCELED / PARTIAL_CANCELED 등
        Long balanceAmount
) {}
