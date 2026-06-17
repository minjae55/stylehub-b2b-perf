package kr.remerge.stylehub.domain.dispute.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.dispute.enumtype.DisputeStatus;
import kr.remerge.stylehub.domain.dispute.enumtype.DisputeType;
import kr.remerge.stylehub.domain.dispute.enumtype.RequestedAction;
import kr.remerge.stylehub.domain.dispute.enumtype.ResolutionType;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.global.entity.BaseEntity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(
        name = "disputes",
        indexes = {
                @Index(name = "idx_dispute_order", columnList = "order_id"),
                @Index(name = "idx_dispute_buyer_status", columnList = "buyer_id, status"),
                @Index(name = "idx_dispute_seller_status", columnList = "seller_id, status"),
                @Index(name = "idx_dispute_admin_status", columnList = "admin_id, status"),
                @Index(name = "idx_dispute_type_status", columnList = "dispute_type, status")
        }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Dispute extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dispute_id")
    private Integer disputeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id")
    private User admin;

    @Enumerated(EnumType.STRING)
    @Column(name = "dispute_type", nullable = false, length = 30)
    private DisputeType disputeType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DisputeStatus status;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(name = "buyer_claim", nullable = false, columnDefinition = "TEXT")
    private String buyerClaim;

    @Enumerated(EnumType.STRING)
    @Column(name = "requested_action", nullable = false, length = 30)
    private RequestedAction requestedAction;

    @Enumerated(EnumType.STRING)
    @Column(name = "resolution_type", length = 30)
    private ResolutionType resolutionType;

    @Column(name = "resolution_amount")
    private Long resolutionAmount;

    @Column(name = "admin_memo", columnDefinition = "TEXT")
    private String adminMemo;

    @Column(name = "received_at", nullable = false)
    private LocalDateTime receivedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    public Dispute(
            Order order,
            User buyer,
            User seller,
            DisputeType disputeType,
            String title,
            String buyerClaim,
            RequestedAction requestedAction
    ) {
        this.order = order;
        this.buyer = buyer;
        this.seller = seller;
        this.disputeType = disputeType;
        this.title = title;
        this.buyerClaim = buyerClaim;
        this.requestedAction = requestedAction;
        this.status = DisputeStatus.RECEIVED;
        this.receivedAt = LocalDateTime.now();
    }

    public void assignAdmin(User admin) {
        this.admin = admin;
    }

    public void changeStatus(DisputeStatus status) {
        this.status = status;
    }

    public void resolve(
            ResolutionType resolutionType,
            Long resolutionAmount,
            String adminMemo
    ) {
        this.status = DisputeStatus.RESOLVED;
        this.resolutionType = resolutionType;
        this.resolutionAmount = resolutionAmount;
        this.adminMemo = adminMemo;
        this.resolvedAt = LocalDateTime.now();
    }
}
