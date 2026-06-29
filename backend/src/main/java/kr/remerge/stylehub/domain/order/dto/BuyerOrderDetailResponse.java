package kr.remerge.stylehub.domain.order.dto;

import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
import kr.remerge.stylehub.domain.order.enumtype.OrderType;
import kr.remerge.stylehub.domain.order.enumtype.PaymentMethod;

import java.time.LocalDateTime;
import java.util.List;

public record BuyerOrderDetailResponse(

        Integer orderId,
        String orderNo,

        OrderType orderType,
        Boolean isSample,
        OrderStatus orderStatus,
        LocalDateTime createdAt,

        String buyerName,
        PaymentMethod paymentMethod,

        String receiverName,
        String receiverPhone,
        String receiverZipcode,
        String receiverAddress,
        String receiverAddressDetail,
        String receiverMemo,

        String carrier,
        String trackingNumber,

        Long subtotalAmount,
        Long platformFee,
        Long shippingFee,
        Long totalAmount,

        List<BuyerOrderDetailItemResponse> items,
        List<BuyerOrderLogResponse> logs
) {

    public static BuyerOrderDetailResponse from(
            Order order,
            List<BuyerOrderDetailItemResponse> orderDetailItemResponse,
            List<BuyerOrderLogResponse> orderLogResponse
    ) {

        return new BuyerOrderDetailResponse(
                order.getOrderId(),
                order.getOrderNo(),

                order.getOrderType(),
                order.getIsSample(),
                order.getStatus(),
                order.getCreatedAt(),

                order.getBuyer().getName(),
                order.getPaymentMethod(),

                order.getReceiverName(),
                order.getReceiverPhone(),
                order.getReceiverZipcode(),
                order.getReceiverAddress(),
                order.getReceiverAddressDetail(),
                order.getReceiverMemo(),

                order.getCarrier(),
                order.getTrackingNumber(),

                order.getSubtotalAmount(),
                order.getPlatformFee(),
                order.getShippingFee(),
                order.getTotalAmount(),

                orderDetailItemResponse,
                orderLogResponse

        );

    }
}
