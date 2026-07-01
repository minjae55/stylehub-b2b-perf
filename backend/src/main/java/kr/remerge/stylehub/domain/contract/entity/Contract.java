package kr.remerge.stylehub.domain.contract.entity;


import jakarta.persistence.*;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.contract.enumtype.ContractStatus;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "contracts")
@NoArgsConstructor(access = AccessLevel.PROTECTED)

public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "contract_id")
    private Integer contractId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quote_id", nullable = false)
    private Quote quote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "buyer_company_name", nullable = false, length = 100)
    private String buyerCompanyName;

    @Column(name = "seller_company_name", nullable = false, length = 100)
    private String sellerCompanyName;

    @Column(name = "contract_no", nullable = false, unique = true, length = 30)
    private String contractNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_contract_id")
    private Contract parentContract;

    @Column(nullable = false)
    private Integer version;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContractStatus status = ContractStatus.DRAFT;

    @Column(name = "contract_amount", nullable = false)
    private Long contractAmount;

    @Column(name = "contract_hash", length = 255)
    private String contractHash;

    @Column(name = "pdf_url", length = 2000)
    private String pdfUrl;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "buyer_signed_at")
    private LocalDateTime buyerSignedAt;

    @Column(name = "seller_signed_at")
    private LocalDateTime sellerSignedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "canceled_at")
    private LocalDateTime canceledAt;

    @Column(name = "delivery_date", nullable = false)
    private LocalDate deliveryDate;

    @Column(name = "payment_terms", nullable = false, length = 500)
    private String paymentTerms;

    @Lob
    @Column(name = "return_policy", nullable = false)
    private String returnPolicy;

    @Lob
    @Column(name = "special_terms")
    private String specialTerms;

    private Contract(
            Quote quote,
            Company company,
            String buyerCompanyName,
            String sellerCompanyName,
            String contractNo,
            Long contractAmount,
            LocalDate deliveryDate,
            String paymentTerms,
            String returnPolicy,
            String specialTerms
    ) {
        this.quote = quote;
        this.company = company;
        this.buyerCompanyName = buyerCompanyName;
        this.sellerCompanyName = sellerCompanyName;
        this.contractNo = contractNo;
        this.contractAmount = contractAmount;
        this.deliveryDate = deliveryDate;
        this.paymentTerms = paymentTerms;
        this.returnPolicy = returnPolicy;
        this.specialTerms = specialTerms;
        this.status = ContractStatus.DRAFT;
        this.version = 1;
    }

    public void sellerSign() {
        this.status = ContractStatus.SELLER_SIGNED;
        LocalDateTime now = LocalDateTime.now();
        this.sellerSignedAt = now;
        this.submittedAt = now;
    }

    public void buyerSign() {
        this.status = ContractStatus.BUYER_SIGNED;
        this.buyerSignedAt = LocalDateTime.now();
    }

    public void complete() {
        this.status = ContractStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public void cancel() {
        this.status = ContractStatus.CANCELED;
    }

    public void expire() {
        this.status = ContractStatus.EXPIRED;
    }

    public void updatePdfUrl(String pdfUrl) {
        this.pdfUrl = pdfUrl;
    }

    public void updateContractHash(String contractHash) {
        this.contractHash = contractHash;
    }

    public static Contract createDraftFromQuote(
            Quote quote,
            String contractNo,
            LocalDate deliveryDate,
            String paymentTerms,
            String returnPolicy,
            String specialTerms
    ) {

        if (deliveryDate == null) {
            throw new IllegalArgumentException("납품 예정일은 필수입니다.");
        }

        if (paymentTerms == null || paymentTerms.isBlank()) {
            throw new IllegalArgumentException("결제 조건은 필수입니다.");
        }

        if (returnPolicy == null || returnPolicy.isBlank()) {
            throw new IllegalArgumentException("반품·교환 조건은 필수입니다.");
        }

        return new Contract(
                quote,
                quote.getCompany(),
                quote.getBuyer().getCompany().getName(),
                quote.getCompany().getName(),
                contractNo,
                quote.getTotalAmount(),
                deliveryDate,
                paymentTerms,
                returnPolicy,
                specialTerms
        );
    }
}

