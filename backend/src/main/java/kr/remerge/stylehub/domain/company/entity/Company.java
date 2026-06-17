package kr.remerge.stylehub.domain.company.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.company.enumtype.CompanyStatus;
import kr.remerge.stylehub.domain.company.enumtype.CompanyStoreType;
import kr.remerge.stylehub.domain.company.enumtype.SellerStatus;
import kr.remerge.stylehub.global.entity.BaseEntity;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "companies")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Company extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "company_id")
    private Integer companyId;

    // 기본 반품지 (없을 수도 있음)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_return_address_id")
    private Address defaultReturnAddress;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "business_number", nullable = false, unique = true, length = 20)
    private String businessNumber;

    @Column(name = "representative_name", length = 50)
    private String representativeName;

    @Column(name = "representative_phone", length = 20)
    private String representativePhone;

    @Column(name = "website_url", length = 255)
    private String websiteUrl;

    @Column(length = 2000)
    private String description;

    @Column(length = 255)
    private String address;

    @Column(name = "address_detail", length = 255)
    private String addressDetail;

    @Column(name = "logo_url", length = 2000)
    private String logoUrl;

    @Column(name = "business_license_url", length = 2000)
    private String businessLicenseUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "store_type", length = 10)
    private CompanyStoreType storeType;

    // PENDING / APPROVED / REJECTED / DELETED / SUSPENDED
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CompanyStatus status;

    // NONE / PENDING / APPROVED / REJECTED
    @Enumerated(EnumType.STRING)
    @Column(name = "seller_status", nullable = false, length = 20)
    private SellerStatus sellerStatus;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // ───────────────────────────────────────────
    // 생명주기 콜백
    // ───────────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = CompanyStatus.PENDING;
        if (this.sellerStatus == null) this.sellerStatus = SellerStatus.NONE;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ───────────────────────────────────────────
    // 상태 변경 메서드
    // ───────────────────────────────────────────

    // 회사 승인
    public void approve() {
        this.status = CompanyStatus.APPROVED;
    }

    // 회사 정지
    public void suspend() {
        this.status = CompanyStatus.SUSPENDED;
    }

    // 회사 삭제
    public void delete() {
        this.status = CompanyStatus.DELETED;
        this.deletedAt = LocalDateTime.now();
    }

    // 셀러 신청
    public void applyForSeller() {
        this.sellerStatus = SellerStatus.PENDING;
    }

    // 셀러 승인
    public void approveSeller() {
        this.sellerStatus = SellerStatus.APPROVED;
    }

    // 셀러 거절
    public void rejectSeller() {
        this.sellerStatus = SellerStatus.REJECTED;
    }

    // 기본 반품지 변경
    public void updateDefaultReturnAddress(Address address) {
        this.defaultReturnAddress = address;
    }
}