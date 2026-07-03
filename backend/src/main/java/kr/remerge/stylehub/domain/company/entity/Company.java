package kr.remerge.stylehub.domain.company.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.address.Address;
import kr.remerge.stylehub.domain.company.enumtype.CompanyStatus;
import kr.remerge.stylehub.domain.company.enumtype.CompanyStoreType;
import kr.remerge.stylehub.domain.company.enumtype.SellerStatus;
import kr.remerge.stylehub.domain.user.enumtype.BusinessRole;
import kr.remerge.stylehub.global.entity.BaseEntity;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
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
    @ManyToOne(fetch = FetchType.LAZY)
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

    @Builder.Default
    @Column(name = "base_shipping_fee", nullable = false)
    private Long baseShippingFee = 0L;

    @Column(name = "free_shipping_threshold")
    private Long freeShippingThreshold;

    @Column(name = "avg_lead_time_days")
    private Integer avgLeadTimeDays;

    @Column(name = "answer_average")
    private Double answerAverage;

    @Enumerated(EnumType.STRING)
    @Column(name = "store_type", length = 10)
    private CompanyStoreType storeType;

    // PENDING / APPROVED / REJECTED / DELETED / SUSPENDED
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CompanyStatus status = CompanyStatus.PENDING;

    // NONE / PENDING / APPROVED / REJECTED
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "seller_status", nullable = false, length = 20)
    private SellerStatus sellerStatus = SellerStatus.NONE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

// ───────────────────────────────────────────
// 비즈니스 검증 메서드
// ───────────────────────────────────────────
    /**
     * 직원이 해당 역할군(Role)으로 이 회사에 가입 신청할 수 있는지 검증합니다.
     * @param businessRole 가입 요청한 직원의 역할군 (BUYER 또는 SELLER)
     */
    public void validateEmployeeJoinEligibility(BusinessRole businessRole) {
        // 1. [공통 회사 상태 검증] 회사의 기본 상태가 PENDING이거나 APPROVED가 아니라면 무조건 가입 불가
        if (this.status != CompanyStatus.PENDING && this.status != CompanyStatus.APPROVED) {
            throw new BusinessException(ErrorCode.INVALID_COMPANY_STATUS);
        }

        // 2. [역할군별 세부 심사 상태(SellerStatus) 검증]
        if (businessRole == BusinessRole.SELLER) {
            // 셀러 직원은 회사의 심사 상태가 APPROVED도 아니고 'PENDING도 아니라면' 예외 발생 (&& 연산자 적용)
            if (this.sellerStatus != SellerStatus.APPROVED && this.sellerStatus != SellerStatus.PENDING) {
                throw new BusinessException(ErrorCode.COMPANY_NOT_APPROVED);
            }
        } else if (businessRole == BusinessRole.BUYER) {
            // 바이어 직원은 회사가 NONE(최초생성 기본값)이거나 APPROVED(정식승인) 상태여야 함
            if (this.sellerStatus != SellerStatus.NONE && this.sellerStatus != SellerStatus.APPROVED && this.sellerStatus != SellerStatus.PENDING) {
                throw new BusinessException(ErrorCode.INVALID_COMPANY_STATUS);
            }
        } else {
            throw new BusinessException(ErrorCode.INVALID_JOIN_ROLE);
        }
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
