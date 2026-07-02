package kr.remerge.stylehub.domain.sourcing.dto;

import kr.remerge.stylehub.domain.sourcing.entity.SupplierProfile;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SupplierProfileResponse {

    private String sourcingType;      // NONE / READY / CUSTOM / BOTH
    private boolean autoAssignEnabled;

    public static SupplierProfileResponse from(SupplierProfile profile) {
        return SupplierProfileResponse.builder()
                .sourcingType(profile.getSourcingType().name())
                .autoAssignEnabled(profile.isAutoAssignEnabled())
                .build();
    }
}
