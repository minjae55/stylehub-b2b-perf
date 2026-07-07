package kr.remerge.stylehub.domain.dashboard.dto.buyer;

import lombok.Getter;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Getter
public class BuyerQuoteDashboardResponse {
    private final Integer quoteId;
    private final String quoteNo;
    private final String productName;
    private final String companyName;
    private final Integer qty;
    private final Long unitPrice;
    private final Long totalAmount;
    private final String status;
    private final Boolean isUrgent; // 유효기간 마감 임박 (예: 24시간 이내)
    private final String expiresAt;

    private BuyerQuoteDashboardResponse(Integer quoteId, String quoteNo, String productName, String companyName,
                                        Integer qty, Long unitPrice, Long totalAmount, String status, Boolean isUrgent, String expiresAt) {
        this.quoteId = quoteId;
        this.quoteNo = quoteNo;
        this.productName = productName;
        this.companyName = companyName;
        this.qty = qty;
        this.unitPrice = unitPrice;
        this.totalAmount = totalAmount;
        this.status = status;
        this.isUrgent = isUrgent;
        this.expiresAt = expiresAt;
    }

    public static BuyerQuoteDashboardResponse of(Integer quoteId, String quoteNo, String productName, String companyName,
                                                 Integer qty, Long unitPrice, Long totalAmount, String status, LocalDateTime validUntil) {
        boolean isUrgent = false;
        if (validUntil != null) {
            isUrgent = ChronoUnit.HOURS.between(LocalDateTime.now(), validUntil) <= 24 && validUntil.isAfter(LocalDateTime.now());
        }

        return new BuyerQuoteDashboardResponse(
                quoteId, quoteNo, productName, companyName, qty, unitPrice, totalAmount, status,
                isUrgent, validUntil != null ? validUntil.toString() : null
        );
    }
}