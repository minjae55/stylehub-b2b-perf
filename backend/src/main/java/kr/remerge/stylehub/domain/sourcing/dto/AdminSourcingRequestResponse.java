package kr.remerge.stylehub.domain.sourcing.dto;

import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

// 관리자 - 전체 소싱 요청 목록 (회사 무관, 실제 SourcingStatus 그대로 노출)
@Getter
@Builder
public class AdminSourcingRequestResponse {

    private Integer sourcingRequestId;
    private String sourcingNo;
    private String type; // READY / CUSTOM
    private SourcingStatus status;
    private String productName;
    private String brandName;
    private Integer buyerCompanyId;
    private String buyerCompanyName;
    private String needSample; // Y / N
    private String mainMaterial;
    private Long unitPrice;
    private Long totalBudget;
    private String refUrl;
    private LocalDate deliveryDate;
    private LocalDate expiryDate;
    private Integer categoryId;
    private String categoryName;
    private String detail;
    private LocalDateTime createdAt;
    private int pendingSupplierCount; // 승인 대기(SUGGESTED) 후보 업체 수, 없으면 0

    public static AdminSourcingRequestResponse of(
            SourcingRequest request, String buyerCompanyName, String categoryName, int pendingSupplierCount
    ) {
        return AdminSourcingRequestResponse.builder()
                .sourcingRequestId(request.getSourcingRequestId())
                .sourcingNo(request.getSourcingNo())
                .type(request.getType())
                .status(request.getStatus())
                .productName(request.getProductName())
                .brandName(request.getBrandName())
                .buyerCompanyId(request.getBuyerCompanyId())
                .buyerCompanyName(buyerCompanyName)
                .needSample(request.getNeedSample())
                .mainMaterial(request.getMainMaterial())
                .unitPrice(request.getUnitPrice())
                .totalBudget(request.getTotalBudget())
                .refUrl(request.getRefUrl())
                .deliveryDate(request.getDeliveryDate())
                .expiryDate(request.getExpiryDate())
                .categoryId(request.getCategoryId())
                .categoryName(categoryName)
                .detail(request.getDetail())
                .createdAt(request.getCreatedAt())
                .pendingSupplierCount(pendingSupplierCount)
                .build();
    }
}