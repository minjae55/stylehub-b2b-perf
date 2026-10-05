package kr.remerge.stylehub.domain.negotiation.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.contract.entity.Contract;
import kr.remerge.stylehub.domain.negotiation.dto.NegotiationCreateRequest;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "negotiations",
        indexes = {
                @Index(name = "idx_negotiations_buyer_updated", columnList =
                        "buyer_id, updated_at"),
                @Index(name = "idx_negotiations_seller_updated", columnList =
                        "seller_id, updated_at")
                 }
        )
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Negotiation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "negotiation_id")
    private Integer negotiationId;

    @Column(name = "negotiation_type", nullable = false, length = 30)
    private String negotiationType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quote_id")
    private Quote quote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private Contract contract;

    @Column(name = "buyer_id", nullable = false)
    private Integer buyerId;

    @Column(name = "seller_id", nullable = false)
    private Integer sellerId;

    @Column(name = "admin_id")
    private Integer adminId;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(name = "opened_at", nullable = false)
    private LocalDateTime openedAt;

    @Column(name = "agreed_at")
    private LocalDateTime agreedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Negotiation(
            String negotiationType,
            Quote quote,
            Contract contract,
            Integer buyerId,
            Integer sellerId,
            String title
    ) {
        this.negotiationType = negotiationType;
        this.quote = quote;
        this.contract = contract;
        this.buyerId = buyerId;
        this.sellerId = sellerId;
        this.title = title;
        this.status = "OPEN";
        this.openedAt = LocalDateTime.now();
    }

    public static Negotiation from(NegotiationCreateRequest request) {
        return null;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;

        if (this.openedAt == null) {
            this.openedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void assignAdmin(Integer adminId) {
        this.adminId = adminId;
    }

    public void markRequested() {
        this.updatedAt = LocalDateTime.now();
    }

    public void agree() {
        this.status = "AGREED";
        this.agreedAt = LocalDateTime.now();
    }

    public void close() {
        this.status = "CLOSED";
        this.closedAt = LocalDateTime.now();
    }

    public void reopen() {
        this.status = "OPEN";
    }
}
