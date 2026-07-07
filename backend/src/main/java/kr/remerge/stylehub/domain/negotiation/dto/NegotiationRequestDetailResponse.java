package kr.remerge.stylehub.domain.negotiation.dto;

import kr.remerge.stylehub.domain.contract.entity.Contract;
import kr.remerge.stylehub.domain.negotiation.entity.NegotiationRequest;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.quote.entity.QuoteItem;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

// 협의 스레드의 라운드 하나(제안 -> 셀러 응답)를 나타낸다.
// negotiationType이 QUOTE면 requestedQuote/revisedQuote가, CONTRACT면 requestedContract/revisedContract가 채워진다.
public record NegotiationRequestDetailResponse(
        Integer negotiationRequestId,
        String status,
        String buyerRequest,
        Long desiredUnitPrice,
        Integer desiredLeadTimeDays,
        String sellerMemo,
        LocalDateTime requestedAt,
        LocalDateTime respondedAt,
        LocalDateTime acceptedAt,
        LocalDateTime canceledAt,
        QuoteSummary requestedQuote,
        QuoteSummary revisedQuote,
        ContractSummary requestedContract,
        ContractSummary revisedContract
) {

    public static NegotiationRequestDetailResponse from(
            NegotiationRequest request,
            List<QuoteItem> requestedQuoteItems,
            List<QuoteItem> revisedQuoteItems
    ) {
        return new NegotiationRequestDetailResponse(
                request.getNegotiationRequestId(),
                request.getStatus(),
                request.getBuyerRequest(),
                request.getDesiredUnitPrice(),
                request.getDesiredLeadTimeDays(),
                request.getSellerMemo(),
                request.getRequestedAt(),
                request.getRespondedAt(),
                request.getAcceptedAt(),
                request.getCanceledAt(),
                QuoteSummary.from(request.getRequestedQuote(), requestedQuoteItems),
                QuoteSummary.from(request.getRevisedQuote(), revisedQuoteItems),
                ContractSummary.from(request.getRequestedContract()),
                ContractSummary.from(request.getRevisedContract())
        );
    }

    public record QuoteSummary(
            Integer quoteId,
            Integer version,
            Integer leadTimeDays,
            Long shippingFee,
            LocalDateTime validUntil,
            String sellerMemo,
            Long totalAmount,
            List<ItemSummary> items
    ) {
        public static QuoteSummary from(Quote quote, List<QuoteItem> items) {
            if (quote == null) {
                return null;
            }

            List<ItemSummary> itemSummaries = items == null
                    ? List.of()
                    : items.stream().map(ItemSummary::from).toList();

            return new QuoteSummary(
                    quote.getQuoteId(),
                    quote.getVersion(),
                    quote.getLeadTimeDays(),
                    quote.getShippingFee(),
                    quote.getValidUntil(),
                    quote.getSellerMemo(),
                    quote.getTotalAmount(),
                    itemSummaries
            );
        }
    }

    public record ItemSummary(
            String optionSummary,
            Integer quantity,
            Long unitPrice,
            Boolean sample
    ) {
        public static ItemSummary from(QuoteItem item) {
            return new ItemSummary(
                    item.getOptionSummary(),
                    item.getQuantity(),
                    item.getUnitPrice(),
                    item.getIsSample()
            );
        }
    }

    public record ContractSummary(
            Integer contractId,
            Integer version,
            String contractName,
            LocalDate deliveryDate,
            String paymentTerms,
            String returnPolicy,
            String specialTerms,
            Long contractAmount
    ) {
        public static ContractSummary from(Contract contract) {
            if (contract == null) {
                return null;
            }

            return new ContractSummary(
                    contract.getContractId(),
                    contract.getVersion(),
                    contract.getContractName(),
                    contract.getDeliveryDate(),
                    contract.getPaymentTerms(),
                    contract.getReturnPolicy(),
                    contract.getSpecialTerms(),
                    contract.getContractAmount()
            );
        }
    }
}
