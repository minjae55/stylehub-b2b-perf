package kr.remerge.stylehub.domain.banktransfer.dto;

import jakarta.validation.constraints.NotBlank;

public record DepositAccountRequest(
        @NotBlank String bankName,
        @NotBlank String accountNumber,
        @NotBlank String accountHolder
) {
}
