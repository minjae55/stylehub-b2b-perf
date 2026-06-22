package kr.remerge.stylehub.domain.sourcing.dto;

import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequestFile;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequestItem;
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
        private Integer subCategoryId;
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
        private final Integer subCategoryId;
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

        public static DetailResponse of(
                SourcingRequest req,
                List<ItemResponse> items,
                List<FileResponse> files
        ) {
            return new DetailResponse(
                    req.getSourcingRequestId(),
                    req.getSourcingNo(),
                    req.getType(),
                    req.getStatus().name(),
                    req.getProductName(),
                    req.getBrandName(),
                    req.getSubCategoryId(),
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
                    files
            );
        }

        private DetailResponse(
                Integer sourcingRequestId, String sourcingNo, String type, String status,
                String productName, String brandName, Integer subCategoryId,
                String needSample, String mainMaterial, Long unitPrice, String refUrl,
                Long totalBudget, String detail, LocalDate deliveryDate, LocalDate expiryDate,
                LocalDateTime createdAt, List<ItemResponse> items, List<FileResponse> files
        ) {
            this.sourcingRequestId = sourcingRequestId;
            this.sourcingNo = sourcingNo;
            this.type = type;
            this.status = status;
            this.productName = productName;
            this.brandName = brandName;
            this.subCategoryId = subCategoryId;
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
}
