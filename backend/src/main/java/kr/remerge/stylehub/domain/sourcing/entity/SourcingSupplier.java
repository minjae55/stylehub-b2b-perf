package kr.remerge.stylehub.domain.sourcing.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingSupplierStatus;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.global.entity.BaseEntity;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "sourcing_suppliers",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_sourcing_supplier",
                columnNames = {"sourcing_request_id", "seller_company_id"}
        )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class SourcingSupplier extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sourcing_supplier_id")
    private Integer sourcingSupplierSId;

    // 낙관적 락 - 동시 수정 충돌 감지용 (ex. buyer 취소 + seller 견적 제출 동시 발생)
    @Version
    @Column(nullable = false)
    private Long version;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sourcing_request_id", nullable = false)
    private SourcingRequest sourcingRequest;

    @Column(name = "seller_company_id", nullable = false)
    private Integer sellerCompanyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by")
    private User assignedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SourcingSupplierStatus status = SourcingSupplierStatus.SUGGESTED;

    @Lob
    @Column(name = "manager_note")
    private String managerNote;

    @Lob
    @Column(name = "seller_feedback")
    private String sellerFeedback;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quote_id")
    private Quote quote;

    public void approve(User admin) {
        if (this.status != SourcingSupplierStatus.SUGGESTED) {
            throw new BusinessException(ErrorCode.INVALID_SOURCING_SUPPLIER_STATUS);
        }
        this.assignedBy = admin;
        this.status = SourcingSupplierStatus.RECOMMENDED;
        this.approvedAt = LocalDateTime.now();
    }

    // 관리자가 SUGGESTED 단계에서 반려 (셀러에게 노출되지 않고 차단됨)
    public void reject(User admin, String reason) {
        if (this.status != SourcingSupplierStatus.SUGGESTED) {
            throw new BusinessException(ErrorCode.INVALID_SOURCING_SUPPLIER_STATUS);
        }
        this.assignedBy = admin;
        this.status = SourcingSupplierStatus.REJECTED;
        this.managerNote = reason;
        this.respondedAt = LocalDateTime.now();
    }

    public void decline(String feedback) {
        if (this.status != SourcingSupplierStatus.RECOMMENDED) {
            throw new BusinessException(ErrorCode.INVALID_SOURCING_SUPPLIER_STATUS);
        }
        this.sellerFeedback = feedback;
        this.status = SourcingSupplierStatus.DECLINED;
        this.respondedAt = LocalDateTime.now();
    }

    public void quote( Quote quote) {
        this.quote = quote;
        this.status = SourcingSupplierStatus.QUOTED;
        this.respondedAt = LocalDateTime.now();
    }

    // 바이어가 요청 자체를 취소해서 배정이 무효화된 경우 - 셀러의 능동적 액션이 아니므로 sellerFeedback 사용 안 함
    public void cancelByBuyerWithdrawal() {
        this.status = SourcingSupplierStatus.CANCELLED;
        this.respondedAt = LocalDateTime.now();
    }
}