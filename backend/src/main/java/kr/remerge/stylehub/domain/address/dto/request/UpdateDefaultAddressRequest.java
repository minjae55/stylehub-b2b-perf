package kr.remerge.stylehub.domain.address.dto.request;

import jakarta.validation.constraints.NotNull;
import kr.remerge.stylehub.domain.address.enumtype.DefaultType;

public record UpdateDefaultAddressRequest(
        @NotNull(message = "주소 ID는 필수입니다.") Integer addressId,
        @NotNull(message = "변경할 기본지 타입(defaultType)은 필수입니다.") DefaultType defaultType
) {
}