package kr.remerge.stylehub.domain.company.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.global.entity.BaseEntity;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "company_bank_accounts",
        indexes = {
                @Index(name = "idx_company_id", columnList = "company_id"),
                @Index(name = "idx_company_is_default", columnList = "company_id, is_default")
        })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class CompanyBankAccount extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bank_account_id")
    private Integer bankAccountId;

    // 소속 회사
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    // 은행명
    @Column(name = "bank_name", nullable = false, length = 50)
    private String bankName;

    // 계좌번호 (추후 암호화 고려)
    @Column(name = "account_number", nullable = false, length = 50)
    private String accountNumber;

    // 예금주
    @Column(name = "account_holder", nullable = false, length = 50)
    private String accountHolder;

    // 기본 계좌 여부 (회사당 1개만 true 권장)
    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private boolean isDefault = false;

    // 계좌 인증 여부 (1원 인증 등 추후 구현 예정)
    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private boolean isVerified = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // ───────────────────────────────────────────
    // 상태 변경 메서드
    // ───────────────────────────────────────────

    // 기본 계좌로 설정
    public void setAsDefault() {
        this.isDefault = true;
    }

    // 기본 계좌 해제
    public void unsetDefault() {
        this.isDefault = false;
    }

    // 계좌 인증 완료 (추후 1원 인증 등 구현 시 사용)
    public void verify() {
        this.isVerified = true;
    }

    // 소프트 삭제
    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }

    // 계좌 정보 수정
    public void update(String bankName, String accountNumber, String accountHolder) {
        this.bankName = bankName;
        this.accountNumber = accountNumber;
        this.accountHolder = accountHolder;
    }
}