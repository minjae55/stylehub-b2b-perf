package kr.remerge.stylehub.domain.sourcing.dto;

import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class BuyerSourcingResponse {

    private Integer sourcingRequestId;
    private String sourcingNo;
    private String type;
    private String status;
    private String productName;
    private String brandName;
    private Integer categoryId;
    private String categoryName;   // 소분류 카테고리명 (categories.category_name)
    private String needSample;
    private Long unitPrice;
    private Long totalBudget;
    private LocalDate deliveryDate;
    private LocalDate expiryDate;
    private String createdAt;
    private int bidCount;

    public static BuyerSourcingResponse from(SourcingRequest request, int bidCount, String categoryName) {
        return BuyerSourcingResponse.builder()
                .sourcingRequestId(request.getSourcingRequestId())
                .sourcingNo(request.getSourcingNo())
                .type(request.getType())
                .status(request.getStatus().name())
                .productName(request.getProductName())
                .brandName(request.getBrandName())
                .categoryId(request.getCategoryId())
                .categoryName(categoryName)
                .needSample(request.getNeedSample())
                .unitPrice(request.getUnitPrice())
                .totalBudget(request.getTotalBudget())
                .deliveryDate(request.getDeliveryDate())
                .expiryDate(request.getExpiryDate())
                .createdAt(request.getCreatedAt().toString())
                .bidCount(bidCount)
                .build();
    }
}