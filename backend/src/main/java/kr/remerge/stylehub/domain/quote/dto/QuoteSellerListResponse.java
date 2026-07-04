package kr.remerge.stylehub.domain.quote.dto;

import kr.remerge.stylehub.domain.contract.enumtype.ContractStatus;
import kr.remerge.stylehub.domain.quote.entity.Quote;

import java.time.LocalDateTime;

public record QuoteSellerListResponse(

    Integer quoteId,
    String quoteNo,
    Integer sourcingRequestId,
    String productName,
    Long totalAmount,
    Integer leadTimeDays,
    LocalDateTime validUntil,
    String status,
    LocalDateTime submittedAt,
    ContractStatus contractStatus
) {

    public static QuoteSellerListResponse from(
            Quote quote,
            ContractStatus contractStatus
    ) {
        return new QuoteSellerListResponse(
                quote.getQuoteId(),
                quote.getQuoteNo(),
                quote.getSourcingRequest().getSourcingRequestId(),
                quote.getProductName(),
                quote.getTotalAmount(),
                quote.getLeadTimeDays(),
                quote.getValidUntil(),
                quote.getStatus(),
                quote.getSubmittedAt(),
                contractStatus
        );
    }
}
