package kr.remerge.stylehub.domain.order.dto.buyer;

import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;

import java.util.List;

public record BuyerOrderOverviewResponse(

        List<BuyerOrderItemResponse> items,
        BuyerOrderSummaryResponse amountSummary,
        OrderStatus orderStatus
){
}
