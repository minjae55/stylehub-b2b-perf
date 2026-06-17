package kr.remerge.stylehub.domain.dispute.entity;


import jakarta.persistence.*;
import kr.remerge.stylehub.domain.order.entity.OrderItem;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "dispute_products")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DisputeItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dispute_product_id")
    private Integer disputeProductId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispute_id", nullable = false)
    private Dispute dispute;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    @Column(name = "claim_quantity")
    private Integer claimQuantity;

    @Column(name = "claim_reason", columnDefinition = "TEXT")
    private String claimReason;

    @Column(name = "requested_action", length = 30)
    private String requestedAction;

    @Column(name = "resolution_type", length = 30)
    private String resolutionType;

    @Column(name = "resolution_amount")
    private Long resolutionAmount;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public DisputeItem(
            Dispute dispute,
            OrderItem orderItem,
            Integer claimQuantity,
            String claimReason,
            String requestedAction
    ) {
        this.dispute = dispute;
        this.orderItem = orderItem;
        this.claimQuantity = claimQuantity;
        this.claimReason = claimReason;
        this.requestedAction = requestedAction;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
