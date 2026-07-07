package kr.remerge.stylehub.domain.banktransfer.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.banktransfer.enums.BankTransferStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bank_transfer_payments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class BankTransferPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Order의 실제 PK(Integer) 참조 — Toss의 orderIds(String, orderNo)와는 다른 값
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "bank_transfer_payment_orders",
            joinColumns = @JoinColumn(name = "bank_transfer_payment_id")
    )
    @Column(name = "order_id")
    @Builder.Default
    private List<Integer> orderIds = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deposit_account_id", nullable = false)
    private DepositAccount depositAccount;

    @Column(nullable = false)
    private String depositorName;

    @Column(nullable = false)
    private LocalDateTime depositDeadline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BankTransferStatus status = BankTransferStatus.WAITING;

    private LocalDateTime confirmedAt;
    private LocalDateTime canceledAt;

    @Column(length = 255)
    private String cancelReason;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // 상태 전이는 setter 없이 의미 있는 메서드로 캡슐화 (TossPayments 스타일에 더 가깝게)
    public void confirm() {
        this.status = BankTransferStatus.CONFIRMED;
        this.confirmedAt = LocalDateTime.now();
    }

    public void markAsCanceled(String cancelReason) {
        this.status = BankTransferStatus.CANCELED;
        this.canceledAt = LocalDateTime.now();
        this.cancelReason = cancelReason;
    }

    public boolean isCanceled() {
        return this.status == BankTransferStatus.CANCELED;
    }
}