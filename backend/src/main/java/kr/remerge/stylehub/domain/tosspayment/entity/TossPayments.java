package kr.remerge.stylehub.domain.tosspayment.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.tosspayment.enumtype.PaymentStatus;
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

    @Column(name = "canceled_at")
    private LocalDateTime canceledAt;

    @Column(name = "cancel_resaon", length = 2000)
    private String cancelReason;

    @Column(length = 30)
    private String method;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "toss_order_id", nullable = false, length = 64)
    private String tossOrderId; //

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "toss_payment_orders",
            joinColumns = @JoinColumn(name = "toss_payment_id")
    )
    @Column(name = "order_id")
    @Builder.Default
    private List<String> orderIds = new ArrayList<>();

    @Column(name = "va_bank_code", length = 10)
    private String vaBankCode;

    @Column(name = "va_account_number", length = 30)
    private String vaAccountNumber;

    @Column(name = "va_customer_name", length = 50)
    private String vaCustomerName;

    @Column(name = "va_due_date")
    private String vaDueDate;

    public void markAsDone(LocalDateTime approvedAt) {
        this.status = "DONE";
        this.approvedAt = approvedAt;
    }

    public void markAsCanceled(String cancelReason) {
        this.status = PaymentStatus.CANCELED.name();
        this.canceledAt = LocalDateTime.now();
        this.cancelReason = cancelReason;
    }

    public boolean isDone() {
        return PaymentStatus.DONE.name().equals(this.status);
    }

    public boolean isCanceled() {
        return PaymentStatus.CANCELED.name().equals(this.status);
    }
}