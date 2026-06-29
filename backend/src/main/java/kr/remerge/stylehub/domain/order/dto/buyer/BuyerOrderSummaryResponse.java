package kr.remerge.stylehub.domain.order.dto.buyer;

import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.enumtype.PaymentMethod;

public record BuyerOrderSummaryResponse(
        Long subtotalAmount,
        Long shippingFee,
        Long platformFee,
        Long totalAmount,
        PaymentMethod paymentMethod,
        String receiverName,
        String receiverAddress,
        String receiverAddressDetail
) {

    public static BuyerOrderSummaryResponse from(Order order) {

        return new BuyerOrderSummaryResponse(
                order.getSubtotalAmount(),
                order.getShippingFee(),
                order.getPlatformFee(),
                order.getTotalAmount(),
                order.getPaymentMethod(),
                order.getReceiverName(),
                order.getReceiverAddress(),
                order.getReceiverAddressDetail()
        );

    }
}
