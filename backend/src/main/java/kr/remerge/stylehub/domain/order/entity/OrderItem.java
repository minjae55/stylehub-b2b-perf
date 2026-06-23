package kr.remerge.stylehub.domain.order.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.product.entity.Product;
import kr.remerge.stylehub.domain.product.entity.ProductOption;
import kr.remerge.stylehub.domain.user.entity.User;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "order_items",
        indexes = {
                @Index(name = "idx_order_items_order_id", columnList = "order_id"),
                @Index(name = "idx_order_items_product_id", columnList = "product_id"),
                @Index(name = "idx_order_items_assigned_user_id", columnList = "assigned_user_id"
                )
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_item_id")
    private Integer orderItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private kr.remerge.stylehub.domain.order.entity.Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_option_id")
    private ProductOption productOption;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_user_id", nullable = false)
    private User assignedUser;

    @Column(name = "product_name", nullable = false, length = 150)
    private String productName;

    @Column(name = "option_summary", length = 255)
    private String optionSummary;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false)
    private Long unitPrice;

    @Builder.Default
    @Column(name = "additional_price", nullable = false)
    private Long additionalPrice = 0L;

    @Column(name = "total_price", nullable = false)
    private Long totalPrice;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void setCreatedAt() {
        this.createdAt = LocalDateTime.now();
    }
}
