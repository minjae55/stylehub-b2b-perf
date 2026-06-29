package kr.remerge.stylehub.domain.order.checkout.dto;

import java.util.List;

public record MultiOrderCheckoutResponse(

    List<OrderCheckoutResponse> orders,

    Long productAmount,
    Long shippingFee,
    Long totalAmount
    ){
}
