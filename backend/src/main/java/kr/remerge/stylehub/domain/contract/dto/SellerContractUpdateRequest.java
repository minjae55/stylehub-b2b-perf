package kr.remerge.stylehub.domain.contract.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record SellerContractUpdateRequest(

        @NotNull
        @FutureOrPresent
        LocalDate deliveryDate,

        @NotBlank
        String paymentTerms,

        @NotBlank
        @Size(max = 2000)
        String returnPolicy,

        @Size(max = 2000)
        String specialTerms
) {
}
