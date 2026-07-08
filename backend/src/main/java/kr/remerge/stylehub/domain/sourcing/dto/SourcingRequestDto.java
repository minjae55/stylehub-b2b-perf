package kr.remerge.stylehub.domain.sourcing.dto;

import kr.remerge.stylehub.domain.quote.constant.QuoteStatusCode;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequestFile;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequestItem;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingSupplier;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;


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
        // 취소(withdraw) 액션 가능 여부 — 작성자 본인 또는 회사 대표 + 취소 가능 상태(PENDING)일 때만 true.
        // 견적(QUOTED)이 하나라도 접수된 이후에는 셀러가 이미 제출한 견적을 보호하기 위해 취소 불가.
        // (BuyerSourcingService.withdraw()의 상태 체크와 동일한 기준으로 유지할 것)
        private final Boolean canWithdraw;

        public static DetailResponse of(
                SourcingRequest req,
                List<ItemResponse> items,
                List<FileResponse> files,
                List<BidResponse> bids,
                Integer actorUserId,
                String actorRole
        ) {
            boolean isWriter = Objects.equals(req.getBuyer().getUserId(), actorUserId);
            boolean isPresident = "PRESIDENT".equals(actorRole);
            boolean statusWithdrawable = req.getStatus() == SourcingStatus.PENDING;
            boolean canWithdraw = statusWithdrawable && (isWriter || isPresident);
            // bids는 호출부(Service)에서 이미 BidResponse.from(supplier, actorUserId, actorRole)로 매핑되어 넘어옴

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
                    bids,
                    canWithdraw
            );
        }

        private DetailResponse(
                Integer sourcingRequestId, String sourcingNo, String type, String status,
                String productName, String brandName, Integer CategoryId,
                String needSample, String mainMaterial, Long unitPrice, String refUrl,
                Long totalBudget, String detail, LocalDate deliveryDate, LocalDate expiryDate,
                LocalDateTime createdAt, List<ItemResponse> items, List<FileResponse> files,
                List<BidResponse> bids, Boolean canWithdraw
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
            this.canWithdraw = canWithdraw;
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
        private final String quoteStatus;        // 추가
        private final Long totalAmount;
        private final Long unitPrice;
        private final Integer leadTimeDays;
        private final LocalDate availableDate;
        private final String sampleAvailable;
        private final String sellerMemo;
        private final LocalDateTime validUntil;
        // 이 견적에 대해 승인/거절/협의/샘플요청 액션을 할 수 있는지 (작성자 본인 or 대표 + 액션 가능 상태)
        private final Boolean canManage;

        private static final java.util.Set<String> ACTIONABLE_QUOTE_STATUSES = java.util.Set.of(
                QuoteStatusCode.SUBMITTED,
                QuoteStatusCode.NEGOTIATING,
                QuoteStatusCode.SAMPLE_REQUESTED
        );

        public static BidResponse from(SourcingSupplier supplier, Integer actorUserId, String actorRole) {
            Quote quote = supplier.getQuote();
            boolean isApproved = quote != null && QuoteStatusCode.APPROVED.equals(quote.getStatus());

            boolean canManage = false;
            if (quote != null) {
                boolean isWriter = Objects.equals(quote.getBuyer().getUserId(), actorUserId);
                boolean isPresident = "PRESIDENT".equals(actorRole);
                boolean isActionableStatus = ACTIONABLE_QUOTE_STATUSES.contains(quote.getStatus());
                canManage = (isWriter || isPresident) && isActionableStatus;
            }

            return new BidResponse(
                    supplier.getSourcingSupplierSId(),
                    supplier.getSellerCompanyId(),
                    isApproved ? quote.getCompanyName() : null,   // APPROVED 아니면 회사명 비공개
                    supplier.getStatus().name(),
                    supplier.getRespondedAt(),
                    quote != null ? quote.getQuoteId() : null,
                    quote != null ? quote.getStatus() : null,
                    quote != null ? quote.getTotalAmount() : null,
                    quote != null ? quote.getSubtotalAmount() : null,
                    quote != null ? quote.getLeadTimeDays() : null,
                    quote != null ? quote.getSubmittedAt().toLocalDate().plusDays(quote.getLeadTimeDays()) : null,
                    quote != null ? quote.getSampleAvailable() : null,
                    quote != null ? quote.getSellerMemo() : null,
                    quote != null ? quote.getValidUntil() : null,
                    canManage
            );
        }

        private BidResponse(
                Integer sourcingSupplierId, Integer sellerCompanyId, String companyName,
                String status, LocalDateTime submittedAt,
                Integer quoteId, String quoteStatus, Long totalAmount, Long unitPrice, Integer leadTimeDays,
                LocalDate availableDate, String sampleAvailable, String sellerMemo,
                LocalDateTime validUntil, Boolean canManage
        ) {
            this.sourcingSupplierId = sourcingSupplierId;
            this.sellerCompanyId = sellerCompanyId;
            this.companyName = companyName;
            this.status = status;
            this.submittedAt = submittedAt;
            this.quoteId = quoteId;
            this.quoteStatus = quoteStatus;
            this.totalAmount = totalAmount;
            this.unitPrice = unitPrice;
            this.leadTimeDays = leadTimeDays;
            this.availableDate = availableDate;
            this.sampleAvailable = sampleAvailable;
            this.sellerMemo = sellerMemo;
            this.validUntil = validUntil;
            this.canManage = canManage;
        }
    }
}