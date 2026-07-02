package kr.remerge.stylehub.domain.sourcing.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequestFile;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequestItem;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingSupplier;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class SourcingRequestSellerDetailResponse {

    @JsonProperty("sourcing_request_id")
    private Integer sourcingRequestId;

    @JsonProperty("sourcing_no")
    private String sourcingNo;

    private String type;
    private String status;

    @JsonProperty("product_name")
    private String productName;

    @JsonProperty("brand_name")
    private String brandName;

    @JsonProperty("category_id")
    private Integer categoryId;

    @JsonProperty("need_sample")
    private String needSample;

    @JsonProperty("main_material")
    private String mainMaterial;

    @JsonProperty("unit_price")
    private Long unitPrice;

    @JsonProperty("ref_url")
    private String refUrl;

    @JsonProperty("total_budget")
    private Long totalBudget;

    private String detail;

    @JsonProperty("delivery_date")
    private String deliveryDate;

    @JsonProperty("expiry_date")
    private String expiryDate;

    @JsonProperty("created_at")
    private String createdAt;

    private List<ItemDto> items;
    private List<FileDto> files;

    @JsonProperty("my_bid")
    private MyBidDto myBid;

    @Getter
    @Builder
    public static class ItemDto {
        @JsonProperty("sourcing_request_item_id")
        private Integer sourcingRequestItemId;
        @JsonProperty("option_summary")
        private String optionSummary;
        private Integer quantity;
        @JsonProperty("sample_quantity")
        private Integer sampleQuantity;
    }

    @Getter
    @Builder
    public static class FileDto {
        @JsonProperty("sourcing_request_file_id")
        private Integer sourcingRequestFileId;
        @JsonProperty("file_type")
        private String fileType;
        @JsonProperty("file_name")
        private String fileName;
        @JsonProperty("file_url")
        private String fileUrl;
    }

    // 이 상세 페이지는 "거절/제출" 결정까지만 담당. 견적 상세(quote)는 견적 관리 쪽에서 다루므로
    // quote_id는 여기서 내려주지 않는다 (Quote가 아직 없는 SUGGESTED/RECOMMENDED/DECLINED 상태에서
    // getQuote()가 null이라 NPE가 나던 문제도 이걸로 근본 해결됨).
    @Getter
    @Builder
    public static class MyBidDto {
        @JsonProperty("sourcing_supplier_id")
        private Integer sourcingSupplierId;
        private String status;
        @JsonProperty("responded_at")
        private String respondedAt;
    }

    public static SourcingRequestSellerDetailResponse from(
            SourcingRequest request,
            List<SourcingRequestItem> items,
            List<SourcingRequestFile> files,
            SourcingSupplier mySupplier
    ) {
        return SourcingRequestSellerDetailResponse.builder()
                .sourcingRequestId(request.getSourcingRequestId())
                .sourcingNo(request.getSourcingNo())
                .type(request.getType())
                .status(request.getStatus().name())
                .productName(request.getProductName())
                .brandName(request.getBrandName())
                .categoryId(request.getCategoryId())
                .needSample(request.getNeedSample())
                .mainMaterial(request.getMainMaterial())
                .unitPrice(request.getUnitPrice())
                .refUrl(request.getRefUrl())
                .totalBudget(request.getTotalBudget())
                .detail(request.getDetail())
                .deliveryDate(request.getDeliveryDate() != null ? request.getDeliveryDate().toString() : null)
                .expiryDate(request.getExpiryDate() != null ? request.getExpiryDate().toString() : null)
                .createdAt(request.getCreatedAt().toString())
                .items(items.stream()
                        .map(i -> ItemDto.builder()
                                .sourcingRequestItemId(i.getSourcingRequestItemId())
                                .optionSummary(i.getOptionSummary())
                                .quantity(i.getQuantity())
                                .sampleQuantity(i.getSampleQuantity())
                                .build())
                        .toList())
                .files(files.stream()
                        .map(f -> FileDto.builder()
                                .sourcingRequestFileId(f.getSourcingRequestFileId())
                                .fileType(f.getFileType())
                                .fileName(f.getFileName())
                                .fileUrl(f.getFileUrl())
                                .build())
                        .toList())
                .myBid(MyBidDto.builder()
                        .sourcingSupplierId(mySupplier.getSourcingSupplierSId())
                        .status(mySupplier.getStatus().name())
                        .respondedAt(mySupplier.getRespondedAt() != null ? mySupplier.getRespondedAt().toString() : null)
                        .build())
                .build();
    }
}
