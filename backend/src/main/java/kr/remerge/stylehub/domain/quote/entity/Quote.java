package kr.remerge.stylehub.domain.quote.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.quote.constant.QuoteStatusCode;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.user.entity.User;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "quotes",
        indexes = {
                @Index(name = "idx_quotes_sourcing_id", columnList = "sourcing_id"),
                @Index(name = "idx_quotes_seller_id", columnList = "seller_id"),
                @Index(name = "idx_quotes_seller_status_created", columnList = "seller_id,status,created_at")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Quote{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "quote_id")
    private Integer quoteId;

    @Column(name = "quote_no", nullable = false, unique = true, length = 30)
    private String quoteNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sourcing_id", nullable = false)
    private SourcingRequest sourcingRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "company_name", length = 50)
    private String companyName;

    @Column(name = "buyer_name", length = 50)
    private String buyerName;

    @Column(name = "seller_name", length = 50)
    private String sellerName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_quote_id")
    private Quote parentQuote;

    @Builder.Default
    @Column(nullable = false)
    private Integer version = 1;

    @Column(name = "brand_name", length = 100)
    private String brandName;

    @Column(name = "product_name", nullable = false, length = 150)
    private String productName;

    @Column(name = "category_name", length = 100)
    private String categoryName;

    @Column(length = 255)
    private String material;

    @Column(name = "lead_time_days", nullable = false)
    private Integer leadTimeDays;

    @Column(name = "delivery_company", length = 50)
    private String deliveryCompany;

    @Builder.Default
    @Column(name = "shipping_fee", nullable = false)
    private Long shippingFee = 0L;

    @Column(name = "valid_until", nullable = false)
    private LocalDateTime validUntil;

    @Builder.Default
    @Column(name = "sample_available", nullable = false, length = 100)
    private String sampleAvailable = "AVAILABLE";

    @Lob
    @Column(name = "seller_memo")
    private String sellerMemo;

    @Builder.Default
    @Column(name = "subtotal_amount", nullable = false)
    private Long subtotalAmount = 0L;

    @Builder.Default
    @Column(name = "total_amount", nullable = false)
    private Long totalAmount = 0L;

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String status = QuoteStatusCode.SUBMITTED;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @Column(name = "viewed_at")
    private LocalDateTime viewedAt;

    @Column(name = "negotiated_at")
    private LocalDateTime negotiatedAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "expired_at")
    private LocalDateTime expiredAt;

    public void changeStatus(String status) {
        this.status = status;
        LocalDateTime now = LocalDateTime.now();

        switch (status) {
            case "APPROVED" -> this.acceptedAt = now;
            case "NEGOTIATING" -> this.negotiatedAt = now;
            case "EXPIRED" -> this.expiredAt = now;
            default -> {
            }
        }
    }

    public void markViewed() {
        if (this.viewedAt == null) {
            this.viewedAt = LocalDateTime.now();
        }
    }
}
