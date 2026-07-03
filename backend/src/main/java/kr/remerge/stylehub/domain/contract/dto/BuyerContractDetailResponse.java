package kr.remerge.stylehub.domain.contract.dto;

import kr.remerge.stylehub.domain.contract.entity.Contract;
import kr.remerge.stylehub.domain.contract.entity.ContractItem;
import kr.remerge.stylehub.domain.contract.enumtype.ContractStatus;
import kr.remerge.stylehub.domain.quote.entity.Quote;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record BuyerContractDetailResponse(

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
        LocalDate deliveryDate,
        String paymentTerms,
        String returnPolicy,
        String specialTerms,

        LocalDateTime createdAt,
        LocalDateTime sellerSignedAt,
        LocalDateTime buyerSignedAt,
        LocalDateTime completedAt,

        List<BuyerContractItemResponse> items
) {

    public static BuyerContractDetailResponse from(
            Contract contract,
            List<ContractItem> contractItems
    ) {
        Quote quote = contract.getQuote();

        return new BuyerContractDetailResponse(
                contract.getContractId(),
                contract.getContractNo(),

                quote.getQuoteId(),
                quote.getQuoteNo(),

                contract.getStatus(),

                contract.getBuyerCompanyName(),
                quote.getBuyer()
                        .getCompany()
                        .getBusinessNumber(),

                contract.getSellerCompanyName(),
                contract.getCompany()
                        .getBusinessNumber(),

                quote.getProductName(),
                quote.getMaterial(),
                quote.getDeliveryCompany(),
                quote.getShippingFee(),
                quote.getLeadTimeDays(),
                quote.getValidUntil(),

                contract.getContractAmount(),
                contract.getDeliveryDate(),
                contract.getPaymentTerms(),
                contract.getReturnPolicy(),
                contract.getSpecialTerms(),

                contract.getCreatedAt(),
                contract.getSellerSignedAt(),
                contract.getBuyerSignedAt(),
                contract.getCompletedAt(),

                contractItems.stream()
                        .map(BuyerContractItemResponse::from)
                        .toList()
        );
    }
}
