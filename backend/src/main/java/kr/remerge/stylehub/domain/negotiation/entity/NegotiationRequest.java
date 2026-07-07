package kr.remerge.stylehub.domain.negotiation.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.contract.entity.Contract;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "negotiation_requests")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NegotiationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "negotiation_request_id")
    private Integer negotiationRequestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "negotiation_id", nullable = false)
    private Negotiation negotiation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_quote_id")
    private Quote requestedQuote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "revised_quote_id")
    private Quote revisedQuote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_contract_id")
    private Contract requestedContract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "revised_contract_id")
    private Contract revisedContract;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "buyer_request", nullable = false, columnDefinition = "TEXT")
    private String buyerRequest;

    // 바이어가 희망하는 단가/납기를 자유 텍스트(buyerRequest)와 별개로 구조화된 값으로 받는다.
    // QUOTE 타입 협의에서만 의미가 있어 CONTRACT 협의에서는 null로 남는다.
    // 이전 라운드와 비교(증감 표시)하려면 텍스트 파싱이 아니라 실제 숫자 컬럼이 필요해서 추가했다.
    @Column(name = "desired_unit_price")
    private Long desiredUnitPrice;

    @Column(name = "desired_lead_time_days")
    private Integer desiredLeadTimeDays;

    @Column(name = "seller_memo", columnDefinition = "TEXT")
    private String sellerMemo;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "canceled_at")
    private LocalDateTime canceledAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public NegotiationRequest(
            Negotiation negotiation,
            Quote requestedQuote,
            Contract requestedContract,
            String buyerRequest,
            Long desiredUnitPrice,
            Integer desiredLeadTimeDays
    ) {
        this.negotiation = negotiation;
        this.requestedQuote = requestedQuote;
        this.requestedContract = requestedContract;
        this.buyerRequest = buyerRequest;
        this.desiredUnitPrice = desiredUnitPrice;
        this.desiredLeadTimeDays = desiredLeadTimeDays;
        this.status = "REQUESTED";
        this.requestedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;

        if (this.requestedAt == null) {
            this.requestedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void respondWithQuote(Quote revisedQuote, String sellerMemo) {
        this.revisedQuote = revisedQuote;
        this.sellerMemo = sellerMemo;
        this.status = "RESPONDED";
        this.respondedAt = LocalDateTime.now();
    }

    public void respondWithContract(Contract revisedContract, String sellerMemo) {
        this.revisedContract = revisedContract;
        this.sellerMemo = sellerMemo;
        this.status = "RESPONDED";
        this.respondedAt = LocalDateTime.now();
    }

    public void accept() {
        this.status = "ACCEPTED";
        this.acceptedAt = LocalDateTime.now();
    }

    public void cancel() {
        this.status = "CANCELED";
        this.canceledAt = LocalDateTime.now();
    }
}