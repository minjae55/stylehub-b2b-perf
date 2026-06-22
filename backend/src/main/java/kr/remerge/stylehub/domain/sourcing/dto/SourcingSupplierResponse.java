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
    private SourcingSupplierStatus status;
    private String managerNote;

    public static SourcingSupplierResponse from(SourcingSupplier supplier) {
        return SourcingSupplierResponse.builder()
                .sourcingSupplierId(supplier.getSourcingSupplierSId())
                .sellerCompanyId(supplier.getSellerCompanyId())
                .status(supplier.getStatus())
                .managerNote(supplier.getManagerNote())
                .build();
    }
}
