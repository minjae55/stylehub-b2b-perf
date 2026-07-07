package kr.remerge.stylehub.domain.dashboard.dto.buyer;

import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingStatus;
import lombok.Getter;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Getter
public class BuyerSourcingDashboardResponse {
    private final Integer sourcingRequestId;
    private final String sourcingNo;
    private final String productName;
    private final SourcingStatus status;
    private final String category;
    private final Integer qty;
    private final Long budget;
    private final Long daysUntilExpiry;
    private final Integer bidCount;
    private final String expiresAt;

    private BuyerSourcingDashboardResponse(Integer sourcingRequestId, String sourcingNo, String productName,
                                           SourcingStatus status, String category, Integer qty, Long budget,
                                           Long daysUntilExpiry, Integer bidCount, String expiresAt) {
        this.sourcingRequestId = sourcingRequestId;
        this.sourcingNo = sourcingNo;
        this.productName = productName;
        this.status = status;
        this.category = category;
        this.qty = qty;
        this.budget = budget;
        this.daysUntilExpiry = daysUntilExpiry;
        this.bidCount = bidCount;
        this.expiresAt = expiresAt;
    }

    public static BuyerSourcingDashboardResponse of(SourcingRequest req, String categoryName, Integer totalQty, Integer bidCount) {
        long remainingDays = 0;
        if (req.getExpiryDate() != null) {
            remainingDays = ChronoUnit.DAYS.between(LocalDate.now(), req.getExpiryDate());
        }

        return new BuyerSourcingDashboardResponse(
                req.getSourcingRequestId(),
                req.getSourcingNo(),
                req.getProductName(),
                req.getStatus(),
                categoryName,
                totalQty != null ? totalQty : 0,
                req.getTotalBudget(),
                remainingDays < 0 ? 0 : remainingDays,
                bidCount,
                req.getExpiryDate() != null ? req.getExpiryDate().toString() : null
        );
    }
}