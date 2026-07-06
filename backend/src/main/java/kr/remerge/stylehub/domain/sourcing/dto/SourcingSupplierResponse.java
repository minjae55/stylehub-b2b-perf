package kr.remerge.stylehub.domain.sourcing.dto;

import kr.remerge.stylehub.domain.sourcing.entity.SourcingSupplier;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingSupplierStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SourcingSupplierResponse {

    private Integer sourcingSupplierId;
    private Integer sellerCompanyId;
    private String sellerCompanyName;
    private SourcingSupplierStatus status;
    private String managerNote;

    // 회사명 조인 없이 필요한 기존 호출부 호환용 (companyName 모를 때)
    public static SourcingSupplierResponse from(SourcingSupplier supplier) {
        return from(supplier, null);
    }

    public static SourcingSupplierResponse from(SourcingSupplier supplier, String sellerCompanyName) {
        return SourcingSupplierResponse.builder()
                .sourcingSupplierId(supplier.getSourcingSupplierSId())
                .sellerCompanyId(supplier.getSellerCompanyId())
                .sellerCompanyName(sellerCompanyName)
                .status(supplier.getStatus())
                .managerNote(supplier.getManagerNote())
                .build();
    }
}