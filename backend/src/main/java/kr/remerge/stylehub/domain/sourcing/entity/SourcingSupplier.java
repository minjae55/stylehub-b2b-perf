package kr.remerge.stylehub.domain.sourcing.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingSupplierStatus;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.global.entity.BaseEntity;
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

    // 비즈니스 메서드
    public void approve(User admin) {
        this.assignedBy = admin;
        this.status = SourcingSupplierStatus.RECOMMENDED;
        this.approvedAt = LocalDateTime.now();
    }

    public void decline(String feedback) {
        this.sellerFeedback = feedback;
        this.status = SourcingSupplierStatus.DECLINED;
        this.respondedAt = LocalDateTime.now();
    }

    public void quote(String feedback) {
        this.sellerFeedback = feedback;
        this.status = SourcingSupplierStatus.QUOTED;
        this.respondedAt = LocalDateTime.now();
    }
}