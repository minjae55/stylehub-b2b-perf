package kr.remerge.stylehub.domain.deliveryTracker;

import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;

@Getter
@RequiredArgsConstructor
public enum DeliveryCarrier {

    CJ("CJ대한통운", "kr.cjlogistics"),
    HANJIN("한진택배", "kr.hanjin"),
    LOTTE("롯데택배", "kr.lotte"),
    LOGEN("로젠택배", "kr.logen"),
    EPOST("우체국택배", "kr.epost"),
    DUMMY("테스트택배", "dev.track.dummy");

    private final String name;
    private final String carrierId;

    public static DeliveryCarrier fromName(String name) {
        return Arrays.stream(values())
                .filter(carrier -> carrier.name.equals(name))
                .findFirst()
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.UNSUPPORTED_DELIVERY_CARRIER)
                );
    }
}