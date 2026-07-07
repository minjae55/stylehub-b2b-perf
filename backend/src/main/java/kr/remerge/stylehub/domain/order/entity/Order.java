package kr.remerge.stylehub.domain.order.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.contract.entity.Contract;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
import kr.remerge.stylehub.domain.order.enumtype.OrderType;
import kr.remerge.stylehub.domain.order.enumtype.PaymentMethod;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.global.entity.BaseEntity;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "orders",
        indexes = {
                @Index(
                        name = "idx_orders_buyer_created",
                        columnList = "buyer_id, created_at"
                ),
                @Index(
                        name = "idx_orders_seller_company_status_created",
                        columnList = "seller_company_id, status, created_at"
                )
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Order extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Integer orderId;

    @Column(name = "order_no", nullable = false, unique = true, length = 30)
    private String orderNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_company_id", nullable = false)
    private Company sellerCompany;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private Contract contract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quote_id")
    private Quote quote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_order_id")
    private Order parentOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_type", nullable = false)
    private OrderType orderType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Column(name = "seller_company_name", nullable = false, length = 100)
    private String sellerCompanyName;

    @Builder.Default
    @Column(name = "is_sample", nullable = false)
    private Boolean isSample = false;

    @Builder.Default
    @Column(name = "subtotal_amount", nullable = false)
    private Long subtotalAmount = 0L;

    @Builder.Default
    @Column(name = "platform_fee", nullable = false)
    private Long platformFee = 0L;

    @Builder.Default
    @Column(name = "shipping_fee", nullable = false)
    private Long shippingFee = 0L;

    @Builder.Default
    @Column(name = "total_amount", nullable = false)
    private Long totalAmount = 0L;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method")
    private PaymentMethod paymentMethod;

    @Column(name = "receiver_name", nullable = false, length = 50)
    private String receiverName;

    @Column(name = "receiver_phone", nullable = false, length = 30)
    private String receiverPhone;

    @Column(name = "receiver_zipcode", length = 20)
    private String receiverZipcode;

    @Column(name = "receiver_address", nullable = false, length = 255)
    private String receiverAddress;

    @Column(name = "receiver_address_detail", length = 255)
    private String receiverAddressDetail;

    @Column(name = "receiver_memo", length = 255)
    private String receiverMemo;

    @Column(name = "sender_name", length = 50)
    private String senderName;

    @Column(name = "sender_phone", length = 30)
    private String senderPhone;

    @Column(name = "sender_zipcode", length = 20)
    private String senderZipcode;

    @Column(name = "sender_address", length = 255)
    private String senderAddress;

    @Column(name = "sender_address_detail", length = 255)
    private String senderAddressDetail;

    @Column(name = "carrier", length = 50)
    private String carrier; // 택배사 또는 운송사명

    @Column(name = "tracking_number", length = 100)
    private String trackingNumber; // 운송장 번호

    @Column(name = "shipped_at")
    private LocalDateTime shippedAt; // 출고 일시

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt; // 배송 완료 일시

    @Lob
    @Column(name = "canceled_reason")
    private String canceledReason;

    @Column(name = "canceled_at")
    private LocalDateTime canceledAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "canceled_by_user_id")
    private User canceledByUser;

    @Column(name = "agreed_at")
    private LocalDateTime agreedAt;

    public void confirmPayment() {
        this.status = OrderStatus.CONFIRMED;
    }

    public void changeStatus(OrderStatus newStatus) {
        this.status = newStatus;
    }

    public void registerShipment(String carrier, String trackingNumber) {
        this.carrier = carrier;
        this.trackingNumber = trackingNumber;
        this.shippedAt = LocalDateTime.now();
    }

    // shippedAt 등 다른 배송 필드는 건드리지 않고 운송장 번호만 갱신한다.
    // (테스트용 더미 캐리어의 배송완료 강제 처리 등에서 사용)
    public void updateTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }

    public void markDelivered() {
        this.status = OrderStatus.DELIVERED;
        this.deliveredAt = LocalDateTime.now();
    }

    public void cancel(User canceledBy, String reason) {
        if (this.status != OrderStatus.PENDING) {
            throw new IllegalStateException("결제 대기 주문만 바로 취소할 수 있습니다.");
        }

        this.status = OrderStatus.CANCELED;
        this.canceledByUser = canceledBy;
        this.canceledReason = reason.trim();
        this.canceledAt = LocalDateTime.now();
    }

    public void agree() {
        this.status = OrderStatus.COMPLETED;
        this.agreedAt = LocalDateTime.now();
    }


}
