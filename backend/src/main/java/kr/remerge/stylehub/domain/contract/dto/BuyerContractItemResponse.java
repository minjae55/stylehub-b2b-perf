package kr.remerge.stylehub.domain.contract.dto;

import kr.remerge.stylehub.domain.contract.entity.ContractItem;

public record BuyerContractItemResponse(
        Integer contractItemId,
        String productName,
        String optionSummary,
        String material,
        Integer quantity,
        Long unitPrice,
        Long totalPrice
) {
    public static BuyerContractItemResponse from(
            ContractItem item
    ) {
        return new BuyerContractItemResponse(
                item.getContractItemId(),
                item.getProductName(),
                item.getOptionSummary(),
                item.getMaterial(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getTotalPrice()
        );
    }
}