package kr.remerge.stylehub.domain.tosspayment.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.tosspayment.enumtype.PaymentStatus;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "toss_payments",
        indexes = {
                @Index(name = "idx_toss_payments_order_id", columnList = "order_id")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TossPayments {

    @Id
    @Column(name = "toss_payment_id", length = 200)
    private String tossPaymentKey; // 토스 발급 paymentKey

    @Column(name = "toss_order_id", length = 64, nullable = false, unique = true)
    private String tossOrderId; // 우리가 생성해서 토스에 보낸 주문 식별자

    // 연관관계 매핑
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order; // 비즈니스 주문 ID

    @Column(length = 30)
    private String method; // CARD, VIRTUAL_ACCOUNT 등

    @Column(nullable = false, length = 20)
    private String status = "READY"; // READY | DONE | CANCELED

    @Column(nullable = false)
    private Long amount; // 이 결제 시도 금액

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt; // 결제 요청 생성 시각

    @Column(name = "approved_at")
    private LocalDateTime approvedAt; // 결제 승인 완료 시각

    @Builder
    public TossPayments(String tossPaymentKey, String tossOrderId, Order order, String method,
                       String status, Long amount, LocalDateTime requestedAt, LocalDateTime approvedAt) {
        this.tossPaymentKey = tossPaymentKey;
        this.tossOrderId = tossOrderId;
        this.order = order;
        this.method = method;
        if (status != null) this.status = status;
        this.amount = amount;
        this.requestedAt = requestedAt;
        this.approvedAt = approvedAt;
    }

    public void updateStatus(PaymentStatus paymentStatus) {
        this.status = paymentStatus.name();
    }
}