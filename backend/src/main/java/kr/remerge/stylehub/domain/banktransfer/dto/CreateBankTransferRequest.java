package kr.remerge.stylehub.domain.banktransfer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateBankTransferRequest(
        @NotEmpty List<Integer> orderIds,
        @NotBlank String depositorName,
        @NotNull Long depositAccountId
) {
}
