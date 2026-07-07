package kr.remerge.stylehub.domain.order.dto.seller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record OrderShipmentRequest(

        @NotBlank(message = "택배사를 선택해주세요.")
        @Size(max = 50, message = "택배사명은 50자 이하여야 합니다.")
        String carrier,

        @NotBlank(message = "운송장 번호를 입력해주세요.")
        // 일반 택배사는 숫자·하이픈이지만, 배송추적 테스트용 더미 캐리어(리머지택배,
        // dev.track.dummy)는 "yyyy-MM-ddTHH:00:00Z" 형식의 운송장 번호를 쓰기 때문에
        // 영문자(T, Z)와 콜론도 허용해야 한다.
        @Pattern(
                regexp = "^[0-9A-Za-z:-]{8,30}$",
                message = "운송장 번호는 8~30자의 숫자, 영문자, 하이픈, 콜론만 입력할 수 있습니다."
        )
        String trackingNumber
) {
}
