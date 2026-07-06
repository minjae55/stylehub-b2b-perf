package kr.remerge.stylehub.domain.quote.dto;

import kr.remerge.stylehub.domain.contract.entity.Contract;
import kr.remerge.stylehub.domain.contract.enumtype.ContractStatus;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
import kr.remerge.stylehub.domain.quote.entity.Quote;

import java.time.LocalDateTime;

public record QuoteBuyerListResponse(
        Integer quoteId,
        String quoteNo,
        Integer sourcingRequestId,
        String productName,
        String sellerName,
        String companyName,
        Long totalAmount,
        Integer leadTimeDays,
        LocalDateTime validUntil,
        Boolean sampleAvailable,
        String status,
        LocalDateTime submittedAt,
        LocalDateTime viewedAt,
        Integer sampleOrderId,
        OrderStatus sampleOrderStatus,
        Integer contractId,
        String contractName,
        ContractStatus contractStatus
) {

    public static QuoteBuyerListResponse from(
            Quote quote,
            Order sampleOrder,
            Contract contract
    ) {
        return new QuoteBuyerListResponse(
                quote.getQuoteId(),
                quote.getQuoteNo(),
                quote.getSourcingRequest().getSourcingRequestId(),
                quote.getProductName(),
                quote.getSellerName(),
                quote.getCompanyName(),
                quote.getTotalAmount(),
                quote.getLeadTimeDays(),
                quote.getValidUntil(),
                "AVAILABLE".equals(quote.getSampleAvailable()),
                quote.getStatus(),
                quote.getSubmittedAt(),
                quote.getViewedAt(),
                sampleOrder == null ? null : sampleOrder.getOrderId(),
                sampleOrder == null ? null : sampleOrder.getStatus(),
                contract == null ? null : contract.getContractId(),
                contract == null ? null : contract.getContractName(),
                contract == null ? null : contract.getStatus()
        );
    }
}
