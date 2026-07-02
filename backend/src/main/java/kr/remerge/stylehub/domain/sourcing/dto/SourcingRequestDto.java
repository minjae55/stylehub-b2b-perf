package kr.remerge.stylehub.domain.sourcing.dto;

import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequestFile;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequestItem;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingSupplier;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;


public class SourcingRequestDto {

    // ── 요청 (프론트 → 백) ──────────────────────────────────────────
    @Getter
    @NoArgsConstructor
    public static class CreateRequest {
        private Integer buyerId;            // TODO: 인증 붙으면 SecurityContext에서 추출
        private List<ItemRequest> items;
    }

    @Getter
    @NoArgsConstructor
    public static class ItemRequest {
        private String type;                // "READY" | "CUSTOM"
        private String productName;
        private String brandName;
        private Integer categoryId;
        private String needSample;          // "Y" | "N"
        private String mainMaterial;

        // READY 전용
        private Long unitPrice;
        private String refUrl;

        // CUSTOM 전용
        private Long totalBudget;
        private String detail;

        private LocalDate deliveryDate;
        private LocalDate expiryDate;

        private List<OptionRequest> options;
    }

    @Getter
    @NoArgsConstructor
    public static class OptionRequest {
        private String optionSummary;       // "색상: 블랙 / 사이즈: M"
        private Integer quantity;
        private Integer sampleQuantity;
    }

    // ── 생성 응답 ────────────────────────────────────────────────────
    @Getter
    public static class CreateResponse {
        private final List<Integer> sourcingRequestIds;

        public CreateResponse(List<Integer> sourcingRequestIds) {
            this.sourcingRequestIds = sourcingRequestIds;
        }
    }

    // ── 상세 조회 응답 ───────────────────────────────────────────────
    @Getter
    public static class DetailResponse {
        private final Integer sourcingRequestId;
        private final String sourcingNo;
        private final String type;
        private final String status;
        private final String productName;
        private final String brandName;
        private final Integer categoryId;
        private final String needSample;
        private final String mainMaterial;
        private final Long unitPrice;
        private final String refUrl;
        private final Long totalBudget;
        private final String detail;
        private final LocalDate deliveryDate;
        private final LocalDate expiryDate;
        private final LocalDateTime createdAt;
        private final List<ItemResponse> items;
        private final List<FileResponse> files;
        private final List<BidResponse> bids;

        public static DetailResponse of(
                SourcingRequest req,
                List<ItemResponse> items,
                List<FileResponse> files,
                List<BidResponse> bids
        ) {
            return new DetailResponse(
                    req.getSourcingRequestId(),
                    req.getSourcingNo(),
                    req.getType(),
                    req.getStatus().name(),
                    req.getProductName(),
                    req.getBrandName(),
                    req.getCategoryId(),
                    req.getNeedSample(),
                    req.getMainMaterial(),
                    req.getUnitPrice(),
                    req.getRefUrl(),
                    req.getTotalBudget(),
                    req.getDetail(),
                    req.getDeliveryDate(),
                    req.getExpiryDate(),
                    req.getCreatedAt(),
                    items,
                    files,
                    bids
            );
        }

        private DetailResponse(
                Integer sourcingRequestId, String sourcingNo, String type, String status,
                String productName, String brandName, Integer CategoryId,
                String needSample, String mainMaterial, Long unitPrice, String refUrl,
                Long totalBudget, String detail, LocalDate deliveryDate, LocalDate expiryDate,
                LocalDateTime createdAt, List<ItemResponse> items, List<FileResponse> files,
                List<BidResponse> bids
        ) {
            this.sourcingRequestId = sourcingRequestId;
            this.sourcingNo = sourcingNo;
            this.type = type;
            this.status = status;
            this.productName = productName;
            this.brandName = brandName;
            this.categoryId = CategoryId;
            this.needSample = needSample;
            this.mainMaterial = mainMaterial;
            this.unitPrice = unitPrice;
            this.refUrl = refUrl;
            this.totalBudget = totalBudget;
            this.detail = detail;
            this.deliveryDate = deliveryDate;
            this.expiryDate = expiryDate;
            this.createdAt = createdAt;
            this.items = items;
            this.files = files;
            this.bids = bids;
        }
    }

    @Getter
    public static class ItemResponse {
        private final Integer sourcingRequestItemId;
        private final String optionSummary;
        private final Integer quantity;
        private final Integer sampleQuantity;

        public static ItemResponse from(SourcingRequestItem entity) {
            return new ItemResponse(
                    entity.getSourcingRequestItemId(),
                    entity.getOptionSummary(),
                    entity.getQuantity(),
                    entity.getSampleQuantity()
            );
        }

        private ItemResponse(Integer sourcingRequestItemId, String optionSummary,
                             Integer quantity, Integer sampleQuantity) {
            this.sourcingRequestItemId = sourcingRequestItemId;
            this.optionSummary = optionSummary;
            this.quantity = quantity;
            this.sampleQuantity = sampleQuantity;
        }
    }

    @Getter
    public static class FileResponse {
        private final Integer sourcingRequestFileId;
        private final String fileType;
        private final String fileName;
        private final String fileUrl;

        public static FileResponse from(SourcingRequestFile entity) {
            return new FileResponse(
                    entity.getSourcingRequestFileId(),
                    entity.getFileType(),
                    entity.getFileName(),
                    entity.getFileUrl()
            );
        }

        private FileResponse(Integer sourcingRequestFileId, String fileType,
                             String fileName, String fileUrl) {
            this.sourcingRequestFileId = sourcingRequestFileId;
            this.fileType = fileType;
            this.fileName = fileName;
            this.fileUrl = fileUrl;
        }
    }

    @Getter
    public static class BidResponse {
        private final Integer sourcingSupplierId;
        private final Integer sellerCompanyId;
        private final String companyName;
        private final String status;
        private final LocalDateTime submittedAt;
        // Quote 필드
        private final Integer quoteId;
        private final Long totalAmount;
        private final Long unitPrice;
        private final Integer leadTimeDays;
        private final LocalDate availableDate;
        private final String sampleAvailable;
        private final String sellerMemo;
        private final LocalDateTime validUntil;

        public static BidResponse from(SourcingSupplier supplier) {
            Quote quote = supplier.getQuote();

            return new BidResponse(
                    supplier.getSourcingSupplierSId(),
                    supplier.getSellerCompanyId(),
                    quote != null ? quote.getCompanyName() : null,
                    supplier.getStatus().name(),
                    supplier.getRespondedAt(),
                    quote != null ? quote.getQuoteId() : null,
                    quote != null ? quote.getTotalAmount() : null,
                    quote != null ? quote.getSubtotalAmount() : null,
                    quote != null ? quote.getLeadTimeDays() : null,
                    quote != null ? quote.getSubmittedAt().toLocalDate().plusDays(quote.getLeadTimeDays()) : null,
                    quote != null ? quote.getSampleAvailable() : null,
                    quote != null ? quote.getSellerMemo() : null,
                    quote != null ? quote.getValidUntil() : null
            );
        }

        private BidResponse(
                Integer sourcingSupplierId, Integer sellerCompanyId, String companyName,
                String status, LocalDateTime submittedAt,
                Integer quoteId, Long totalAmount, Long unitPrice, Integer leadTimeDays,
                LocalDate availableDate, String sampleAvailable, String sellerMemo,
                LocalDateTime validUntil
        ) {
            this.sourcingSupplierId = sourcingSupplierId;
            this.sellerCompanyId = sellerCompanyId;
            this.companyName = companyName;
            this.status = status;
            this.submittedAt = submittedAt;
            this.quoteId = quoteId;
            this.totalAmount = totalAmount;
            this.unitPrice = unitPrice;
            this.leadTimeDays = leadTimeDays;
            this.availableDate = availableDate;
            this.sampleAvailable = sampleAvailable;
            this.sellerMemo = sellerMemo;
            this.validUntil = validUntil;
        }
    }
}
