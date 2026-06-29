package kr.remerge.stylehub.domain.order.enumtype;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum OrderLogMemo {
    ORDER_CREATED("주문이 생성되어 결제를 기다리고 있습니다."),
    PAYMENT_CONFIRMED("결제 완료로 주문이 확정되었습니다."),
    PREPARING_STARTED("판매사가 출고 준비를 시작했습니다."),
    SHIPPING_STARTED("운송장이 등록되어 배송이 시작되었습니다."),
    DELIVERY_COMPLETED("배송이 완료되었습니다."),
    ORDER_COMPLETED("바이어가 거래를 확정했습니다.");

    private final String message;

}
