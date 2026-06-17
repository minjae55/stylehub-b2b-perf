package kr.remerge.stylehub.domain.negotiation.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.contract.entity.Contract;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.user.entity.User;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "negotiations")
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id")
    private User admin;

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
            User buyer,
            User seller,
            String title
    ) {
        this.negotiationType = negotiationType;
        this.quote = quote;
        this.contract = contract;
        this.buyer = buyer;
        this.seller = seller;
        this.title = title;
        this.status = "OPEN";
        this.openedAt = LocalDateTime.now();
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

    public void assignAdmin(User admin) {
        this.admin = admin;
    }

    public void agree() {
        this.status = "AGREED";
        this.agreedAt = LocalDateTime.now();
    }

    public void close() {
        this.status = "CLOSED";
        this.closedAt = LocalDateTime.now();
    }
}