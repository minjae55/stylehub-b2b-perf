package kr.remerge.stylehub.domain.sourcing.entity;
import jakarta.persistence.*;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingStatus;
import kr.remerge.stylehub.global.entity.BaseEntity;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "sourcing_requests")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class SourcingRequest extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sourcing_request_id")
    private Integer sourcingRequestId;

    @Column(name = "sourcing_no", nullable = false, unique = true, length = 50)
    private String sourcingNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @Column(name = "buyer_company_id", nullable = false)
    private Integer buyerCompanyId;

    @Column(nullable = false, length = 10)
    private String type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SourcingStatus status;

    @Column(name = "product_name", nullable = false, length = 100)
    private String productName;

    @Column(name = "brand_name", length = 50)
    private String brandName;

    @Column(name = "need_sample", nullable = false, length = 1)
    private String needSample;

    @Column(name = "main_material", length = 255)
    private String mainMaterial;

    @Column(name = "unit_price")
    private Long unitPrice;

    @Lob
    @Column(name = "ref_url")
    private String refUrl;

    @Column(name = "delivery_date")
    private LocalDate deliveryDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "total_budget")
    private Long totalBudget;

    @Column(name = "sub_category_id")
    private Integer subCategoryId;

    @Lob
    private String detail;

    // 모든 공급사 거절 시 자동 반려
    public void cancel() {
        this.status = SourcingStatus.CANCELLED;
    }
    public void quote() {
        this.status = SourcingStatus.QUOTED;
    }

    public void withdraw() {
        this.status = SourcingStatus.WITHDRAWN;
    }
}