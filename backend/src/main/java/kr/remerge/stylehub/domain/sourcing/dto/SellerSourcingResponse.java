package kr.remerge.stylehub.domain.sourcing.dto;

import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingSupplier;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingStatus;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingSupplierStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class SellerSourcingResponse {

    private Integer sourcingSupplierId;
    private Integer sourcingRequestId;
    private String  sourcingNo;
    private String  type;
    private String  productName;
    private String  brandName;
    private Integer categoryId;
    private String  needSample;
    private String  mainMaterial;
    private Long    unitPrice;
    private Long    totalBudget;
    private LocalDate deliveryDate;
    private LocalDate expiryDate;
    private String  detail;
    private SourcingSupplierStatus supplierStatus;  // RECOMMENDED / QUOTED / DECLINED / EXPIRED
    private SourcingStatus sourcingStatus;  // PENDING / NEGOTIATING / TRADING / COMPLETED

    // 내가 제출한 견적 요약 (없으면 null) - N+1 방지를 위해 목록 조회 시점에 함께 내려줌
    private QuoteSummary myQuote;

    @Getter
    @Builder
    public static class QuoteSummary {
        private Integer quoteId;
        private String  quoteNo;
        private Long    unitPrice;
        private Long    totalAmount;
        private Integer leadTimeDays;
        private String  validUntil;
        private String  status;       // SUBMITTED / SAMPLE_REQUESTED / APPROVED / REJECTED / ...
        private String  submittedAt;
    }

    public static SellerSourcingResponse from(SourcingSupplier ss) {
        SourcingRequest req = ss.getSourcingRequest();
        Quote quote = ss.getQuote();

        return SellerSourcingResponse.builder()
                .sourcingSupplierId(ss.getSourcingSupplierSId())
                .sourcingRequestId(req.getSourcingRequestId())
                .sourcingNo(req.getSourcingNo())
                .type(req.getType())
                .productName(req.getProductName())
                .brandName(req.getBrandName())
                .categoryId(req.getCategoryId())
                .needSample(req.getNeedSample())
                .mainMaterial(req.getMainMaterial())
                .unitPrice(req.getUnitPrice())
                .totalBudget(req.getTotalBudget())
                .deliveryDate(req.getDeliveryDate())
                .expiryDate(req.getExpiryDate())
                .detail(req.getDetail())
                .supplierStatus(ss.getStatus())
                .sourcingStatus(req.getStatus())
                .myQuote(quote != null ? QuoteSummary.builder()
                        .quoteId(quote.getQuoteId())
                        .quoteNo(quote.getQuoteNo())
                        .unitPrice(null) // 품목별 단가라 목록에서는 생략, 필요시 QuoteItem 조회로 보강
                        .totalAmount(quote.getTotalAmount())
                        .leadTimeDays(quote.getLeadTimeDays())
                        .validUntil(quote.getValidUntil() != null ? quote.getValidUntil().toString() : null)
                        .status(quote.getStatus())
                        .submittedAt(quote.getSubmittedAt() != null ? quote.getSubmittedAt().toString() : null)
                        .build() : null)
                .build();
    }
}
