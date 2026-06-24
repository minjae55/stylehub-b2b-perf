package kr.remerge.stylehub.domain.sourcing.dto;

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
    private Integer subCategoryId;
    private String  needSample;
    private String  mainMaterial;
    private Long    unitPrice;
    private Long    totalBudget;
    private LocalDate deliveryDate;
    private LocalDate expiryDate;
    private String  detail;
    private SourcingSupplierStatus supplierStatus;  // RECOMMENDED / QUOTED / DECLINED / EXPIRED
    private SourcingStatus sourcingStatus;  // PENDING / NEGOTIATING / TRADING / COMPLETED

    public static SellerSourcingResponse from(SourcingSupplier ss) {
        SourcingRequest req = ss.getSourcingRequest();
        return SellerSourcingResponse.builder()
                .sourcingSupplierId(ss.getSourcingSupplierSId())
                .sourcingRequestId(req.getSourcingRequestId())
                .sourcingNo(req.getSourcingNo())
                .type(req.getType())
                .productName(req.getProductName())
                .brandName(req.getBrandName())
                .subCategoryId(req.getSubCategoryId())
                .needSample(req.getNeedSample())
                .mainMaterial(req.getMainMaterial())
                .unitPrice(req.getUnitPrice())
                .totalBudget(req.getTotalBudget())
                .deliveryDate(req.getDeliveryDate())
                .expiryDate(req.getExpiryDate())
                .detail(req.getDetail())
                .supplierStatus(ss.getStatus())
                .sourcingStatus(req.getStatus())
                .build();
    }
}
