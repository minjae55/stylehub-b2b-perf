package kr.remerge.stylehub.domain.sourcing.dto;

import kr.remerge.stylehub.domain.sourcing.enumtype.SupplierSourcingType;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SupplierProfileUpdateRequest {
    private SupplierSourcingType sourcingType;
    private boolean autoAssignEnabled;
}
