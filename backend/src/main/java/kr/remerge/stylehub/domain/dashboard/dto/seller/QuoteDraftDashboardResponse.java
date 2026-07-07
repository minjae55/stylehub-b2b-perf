package kr.remerge.stylehub.domain.dashboard.dto.seller;

import lombok.Getter;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Getter
public class QuoteDraftDashboardResponse {
    private final Integer quoteId;
    private final String productName;
    private final String buyerName;
    private final Integer qty;
    private final Long totalAmount;
    private final String deadline;
    private final Long daysUntilDeadline;
    private final Boolean isOverdue;

    private QuoteDraftDashboardResponse(Integer quoteId, String productName, String buyerName, Integer qty,
                                        Long totalAmount, String deadline, Long daysUntilDeadline, Boolean isOverdue) {
        this.quoteId = quoteId;
        this.productName = productName;
        this.buyerName = buyerName;
        this.qty = qty;
        this.totalAmount = totalAmount;
        this.deadline = deadline;
        this.daysUntilDeadline = daysUntilDeadline;
        this.isOverdue = isOverdue;
    }

    public static QuoteDraftDashboardResponse of(Integer quoteId, String productName, String buyerName, Integer qty,
                                                 Long totalAmount, LocalDate expiryDate) {
        long daysUntil = 0;
        boolean isOverdue = true;

        if (expiryDate != null) {
            daysUntil = ChronoUnit.DAYS.between(LocalDate.now(), expiryDate);
            isOverdue = daysUntil <= 0;
        }

        return new QuoteDraftDashboardResponse(
                quoteId, productName, buyerName, qty, totalAmount,
                expiryDate != null ? expiryDate.toString() : null,
                daysUntil, isOverdue
        );
    }
}