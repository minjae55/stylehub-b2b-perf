package kr.remerge.stylehub.domain.dashboard.dto.seller;

import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Getter
public class SellerShipmentDashboardResponse {
    private final Integer orderId;
    private final String orderNo;
    private final String productName;
    private final String buyerName;
    private final Integer qty;
    private final Long subtotalAmount;
    private final String paidAt;
    private final String shipByDate; // 또는 화면 연동 기준일 (배송 예정일 등)
    private final Boolean isDue;
    private final Boolean isOverdue; 

    private SellerShipmentDashboardResponse(Integer orderId, String orderNo, String productName, String buyerName, Integer qty,
                                            Long subtotalAmount, String paidAt, String shipByDate, Boolean isDue, Boolean isOverdue) {
        this.orderId = orderId;
        this.orderNo = orderNo;
        this.productName = productName;
        this.buyerName = buyerName;
        this.qty = qty;
        this.subtotalAmount = subtotalAmount;
        this.paidAt = paidAt;
        this.shipByDate = shipByDate;
        this.isDue = isDue;
        this.isOverdue = isOverdue;
    }

    public static SellerShipmentDashboardResponse of(Integer orderId, String orderNo, String productName, String buyerName,
                                                     Integer qty, Long subtotalAmount, LocalDateTime paidAt, LocalDate shipByDate) {
        boolean isDue = false;
        boolean isOverdue = false;

        if (shipByDate != null) {
            long remainingDays = ChronoUnit.DAYS.between(LocalDate.now(), shipByDate);
            isOverdue = remainingDays < 0;
            isDue = remainingDays == 0 || remainingDays == 1;
        }

        return new SellerShipmentDashboardResponse(
                orderId, orderNo, productName, buyerName, qty, subtotalAmount,
                paidAt != null ? paidAt.toString() : null,
                shipByDate != null ? shipByDate.toString() : null,
                isDue, isOverdue
        );
    }
}