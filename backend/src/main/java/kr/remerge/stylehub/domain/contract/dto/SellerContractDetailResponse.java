package kr.remerge.stylehub.domain.contract.dto;

import kr.remerge.stylehub.domain.contract.entity.Contract;
import kr.remerge.stylehub.domain.contract.entity.ContractItem;
import kr.remerge.stylehub.domain.contract.enumtype.ContractStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record SellerContractDetailResponse(
        Integer contractId,
        String contractNo,
        Integer quoteId,
        String quoteNo,
        ContractStatus status,
        String buyerCompanyName,
        String buyerBusinessNumber,
        String sellerCompanyName,
        String sellerBusinessNumber,
        String productName,
        String material,
        String deliveryCompany,
        Long shippingFee,
        Integer leadTimeDays,
        LocalDateTime validUntil,
        Long contractAmount,
        LocalDateTime createdAt,
        LocalDateTime sellerSignedAt,
        LocalDate deliveryDate,
        String paymentTerms,
        String returnPolicy,
        String specialTerms,
        List<Item> items
) {

    public static SellerContractDetailResponse from(
            Contract contract,
            List<ContractItem> contractItems
    ) {
        return new SellerContractDetailResponse(
                contract.getContractId(),
                contract.getContractNo(),
                contract.getQuote().getQuoteId(),
                contract.getQuote().getQuoteNo(),
                contract.getStatus(),
                contract.getBuyerCompanyName(),
                contract.getQuote().getBuyer()
                        .getCompany().getBusinessNumber(),
                contract.getSellerCompanyName(),
                contract.getCompany().getBusinessNumber(),
                contract.getQuote().getProductName(),
                contract.getQuote().getMaterial(),
                contract.getQuote().getDeliveryCompany(),
                contract.getQuote().getShippingFee(),
                contract.getQuote().getLeadTimeDays(),
                contract.getQuote().getValidUntil(),
                contract.getContractAmount(),
                contract.getCreatedAt(),
                contract.getSellerSignedAt(),
                contract.getDeliveryDate(),
                contract.getPaymentTerms(),
                contract.getReturnPolicy(),
                contract.getSpecialTerms(),
                contractItems.stream()
                        .map(Item::from)
                        .toList()
        );
    }

    public record Item(
            Integer contractItemId,
            String productName,
            String optionSummary,
            String material,
            Integer quantity,
            Long unitPrice,
            Long totalPrice
    ) {

        private static Item from(ContractItem item) {
            return new Item(
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
}
