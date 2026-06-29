package kr.remerge.stylehub.domain.tosspayment.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "toss_payments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class TossPayments {

    @Id
    @Column(name = "toss_payment_id", length = 200)
    private String tossPaymentId; // 결제 키 (paymentKey)

    @Column(nullable = false)
    private Long amount;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(length = 30)
    private String method;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "toss_order_id", nullable = false, length = 64)
    private String tossOrderId; // 👈 올려주신 이미지의 7번 빨간 열쇠(유니크 키) 마크와 매핑

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "toss_payment_orders",
            joinColumns = @JoinColumn(name = "toss_payment_id")
    )
    @Column(name = "order_id")
    @Builder.Default
    private List<Long> orderIds = new ArrayList<>();
}