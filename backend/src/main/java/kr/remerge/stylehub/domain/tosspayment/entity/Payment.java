package kr.remerge.stylehub.domain.tosspayment.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.tosspayment.enumtype.PaymentStatus;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Payment {
    @Id
    private String paymentKey;

    private String orderId;

    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    private Long amount;
    private String method;
    private LocalDateTime approvedAt;

    @Version
    private Long version;

    @Builder
    public Payment(String paymentKey, String orderId, PaymentStatus status, Long amount, String method) {
        this.paymentKey = paymentKey;
        this.orderId = orderId;
        this.status = status;
        this.amount = amount;
        this.method = method;
    }
}