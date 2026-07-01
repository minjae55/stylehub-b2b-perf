package kr.remerge.stylehub.domain.contract.dto;

import kr.remerge.stylehub.domain.contract.entity.Contract;
import kr.remerge.stylehub.domain.contract.enumtype.ContractStatus;

public record SellerContractCreateResponse(
        Integer contractId,
        Integer quoteId,
        ContractStatus status
) {
    public static SellerContractCreateResponse from(Contract contract) {
        return new SellerContractCreateResponse(
                contract.getContractId(),
                contract.getQuote().getQuoteId(),
                contract.getStatus()
        );
    }
}