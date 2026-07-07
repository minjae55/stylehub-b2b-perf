package kr.remerge.stylehub.domain.banktransfer.dto;

import kr.remerge.stylehub.domain.banktransfer.entity.DepositAccount;

public record DepositAccountResponse(
        Long id,
        String bankName,
        String accountNumber,
        String accountHolder
) {
    public static DepositAccountResponse from(DepositAccount entity) {
        return new DepositAccountResponse(
                entity.getId(),
                entity.getBankName(),
                entity.getAccountNumber(),
                entity.getAccountHolder()
        );
    }
}
