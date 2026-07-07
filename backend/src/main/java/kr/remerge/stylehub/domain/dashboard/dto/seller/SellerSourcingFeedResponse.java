package kr.remerge.stylehub.domain.dashboard.dto.seller;

import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import lombok.Getter;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Getter
public class SellerSourcingFeedResponse {
    private final Integer sourcingRequestId;
    private final String productName;
    private final String buyerCompanyName;
    private final Integer qty;
    private final String category;
    private final Long totalBudget;
    private final String requestedAt;
    private final String expiresAt;
    private final Boolean isNew;

    private SellerSourcingFeedResponse(Integer sourcingRequestId, String productName, String buyerCompanyName,
                                       Integer qty, String category, Long totalBudget, String requestedAt, String expiresAt, Boolean isNew) {
        this.sourcingRequestId = sourcingRequestId;
        this.productName = productName;
        this.buyerCompanyName = buyerCompanyName;
        this.qty = qty;
        this.category = category;
        this.totalBudget = totalBudget;
        this.requestedAt = requestedAt;
        this.expiresAt = expiresAt;
        this.isNew = isNew;
    }

    public static SellerSourcingFeedResponse of(SourcingRequest req, String buyerCompanyName, String categoryName, Integer totalQty) {
        boolean newArrival = false;
        if (req.getCreatedAt() != null) {
            newArrival = ChronoUnit.HOURS.between(req.getCreatedAt(), LocalDateTime.now()) <= 24;
        }

        return new SellerSourcingFeedResponse(
                req.getSourcingRequestId(),
                req.getProductName(),
                buyerCompanyName,
                totalQty != null ? totalQty : 0,
                categoryName,
                req.getTotalBudget(),
                req.getCreatedAt() != null ? req.getCreatedAt().toLocalDate().toString() : null,
                req.getExpiryDate() != null ? req.getExpiryDate().toString() : null,
                newArrival
        );
    }
}