package kr.remerge.stylehub.domain.contract.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.product.entity.Product;
import kr.remerge.stylehub.domain.product.entity.ProductOption;
import kr.remerge.stylehub.global.entity.BaseEntity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "contract_items")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ContractItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "contract_item_id")
    private Integer contractItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    private Contract contract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_option_id")
    private ProductOption productOption;

    @Column(name = "product_name", nullable = false, length = 150)
    private String productName;

    @Column(name = "option_summary", length = 255)
    private String optionSummary;

    @Column(length = 255)
    private String material;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false)
    private Long unitPrice;

    @Column(name = "total_price", nullable = false)
    private Long totalPrice;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public ContractItem(
            Contract contract,
            Product product,
            ProductOption productOption,
            String productName,
            String optionSummary,
            String material,
            Integer quantity,
            Long unitPrice
    ) {
        this.contract = contract;
        this.product = product;
        this.productOption = productOption;
        this.productName = productName;
        this.optionSummary = optionSummary;
        this.material = material;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalPrice = unitPrice * quantity;
    }
}