package kr.remerge.stylehub.domain.tosspayment.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "toss_refunds") // 테이블 레벨 인덱스는 FK 컬럼 자동 생성으로 생략 가능하나 필요시 명시
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TossRefunds {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "toss_refund_id")
    private Integer tossRefundId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "toss_payment_id", nullable = false)
    private TossPayments tossPayment;

    @Column(nullable = false)
    private Long amount; // 환불 금액

    @Column(name = "cancel_reason", columnDefinition = "TEXT")
    private String cancelReason; // 환불 사유

    @Column(name = "canceled_at", nullable = false)
    private LocalDateTime canceledAt; // 환불 처리 완료 시각

    @Builder
    public TossRefunds(TossPayments tossPayment, Long amount, String cancelReason, LocalDateTime canceledAt) {
        this.tossPayment = tossPayment;
        this.amount = amount;
        this.cancelReason = cancelReason;
        this.canceledAt = canceledAt;
    }
}