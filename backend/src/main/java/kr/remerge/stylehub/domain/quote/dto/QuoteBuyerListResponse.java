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
        ContractStatus contractStatus,

        // 계약 체결(서명 완료) 여부만으로는 "이미 결제까지 끝났는지"를 알 수 없어서
        // (계약 완료 후 결제 전 상태와 구분이 안 됨) 본주문(샘플이 아닌 주문) 여부를 별도로 내려준다.
        Integer orderId,
        OrderStatus orderStatus,

        // 협의(재견적)로 생성된 버전인지, 이전 조건 대비 얼마나 바뀌었는지 목록에서도 바로 보여주기 위함.
        Integer version,
        Integer parentQuoteId,
        Long previousTotalAmount,
        Integer previousLeadTimeDays
) {

    public static QuoteBuyerListResponse from(
            Quote quote,
            Order sampleOrder,
            Contract contract,
            Order order
    ) {
        Quote parentQuote = quote.getParentQuote();

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
                contract == null ? null : contract.getStatus(),
                order == null ? null : order.getOrderId(),
                order == null ? null : order.getStatus(),
                quote.getVersion(),
                parentQuote == null ? null : parentQuote.getQuoteId(),
                parentQuote == null ? null : parentQuote.getTotalAmount(),
                parentQuote == null ? null : parentQuote.getLeadTimeDays()
        );
    }
}
