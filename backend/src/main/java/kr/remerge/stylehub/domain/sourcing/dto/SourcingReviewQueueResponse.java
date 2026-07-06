package kr.remerge.stylehub.domain.sourcing.dto;

import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

// 관리자 승인 대기 큐 - SUGGESTED 상태 후보 업체가 하나 이상 있는 소싱 요청 단위 요약
@Getter
@Builder
public class SourcingReviewQueueResponse {

    private Integer sourcingRequestId;
    private String sourcingNo;
    private String type;
    private String productName;
    private String brandName;
    private Integer buyerCompanyId;
    private String buyerCompanyName;
    private Long unitPrice;
    private Long totalBudget;
    private LocalDateTime createdAt;
    private int pendingSupplierCount; // SUGGESTED 상태인 후보 업체 수

    public static SourcingReviewQueueResponse of(
            SourcingRequest request, String buyerCompanyName, int pendingSupplierCount
    ) {
        return SourcingReviewQueueResponse.builder()
                .sourcingRequestId(request.getSourcingRequestId())
                .sourcingNo(request.getSourcingNo())
                .type(request.getType())
                .productName(request.getProductName())
                .brandName(request.getBrandName())
                .buyerCompanyId(request.getBuyerCompanyId())
                .buyerCompanyName(buyerCompanyName)
                .unitPrice(request.getUnitPrice())
                .totalBudget(request.getTotalBudget())
                .createdAt(request.getCreatedAt())
                .pendingSupplierCount(pendingSupplierCount)
                .build();
    }
}
