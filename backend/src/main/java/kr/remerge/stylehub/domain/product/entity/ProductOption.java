package kr.remerge.stylehub.domain.product.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.global.entity.BaseEntity;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "product_options",
        indexes = {
                @Index(name = "idx_product_options_product_id", columnList = "product_id")
        },
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_product_option_label",
                        columnNames = {"product_id", "option_label"}
                ),
                @UniqueConstraint(
                        name = "uk_product_sku",
                        columnNames = {"product_id", "sku"}
                )
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ProductOption extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_option_id")
    private Integer productOptionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "option_label", nullable = false, length = 100)
    private String optionLabel;

    @Column(length = 100)
    private String sku;

    @Builder.Default
    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity = 0;

    @Builder.Default
    @Column(name = "additional_price", nullable = false)
    private Long additionalPrice = 0L;

    @Column(name = "restock_alert_quantity")
    private Integer restockAlertQuantity;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "sample_price")
    private Long samplePrice;

    @Column(name = "sample_max_quantity")
    private Integer sampleMaxQuantity;

    @OneToMany(mappedBy = "productOption")
    private List<ProductOptionValue> optionValues = new ArrayList<>();

    @OneToMany(mappedBy = "productOption", fetch = FetchType.LAZY)
    @OrderBy("isMain DESC, sortOrder ASC")
    private List<ProductImage> images = new ArrayList<>();

    // [추가] 기존 옵션 row를 삭제/재생성하지 않고 필드만 갱신할 때 사용
    // (주문/장바구니에서 이 옵션을 참조 중이어도 row 자체는 유지되므로 FK 제약과 무관하게 안전)
    public void updateFields(String optionLabel, String sku, Integer stockQuantity, Long additionalPrice, Integer restockAlertQuantity) {
        this.optionLabel = optionLabel;
        this.sku = sku;
        this.stockQuantity = stockQuantity;
        this.additionalPrice = additionalPrice;
        this.restockAlertQuantity = restockAlertQuantity;
    }

    // [추가] 판매중지/재개, 또는 삭제 대신 비활성화 처리할 때 사용
    public void setActive(boolean active) {
        this.isActive = active;
    }
}
