package kr.remerge.stylehub.domain.product.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.category.entity.Category;
import kr.remerge.stylehub.domain.company.entity.Brand;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.product.dto.ProductDto;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.global.entity.BaseEntity;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Product extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_id")
    private Integer productId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @Column(name = "product_name", nullable = false, length = 150)
    private String productName;

    @Column(name = "product_eng_name", length = 150)
    private String productEngName;

    @Lob
    @Column(name = "return_policy")
    private String returnPolicy;

    @Column(name = "view_count")
    private Integer viewCount;

    @Column(length = 30)
    private String season;

    @Column(name = "moq", nullable = false)
    private Integer moq;

    @Column(name = "unit_price", nullable = false)
    private Long unitPrice;

    @Column(name = "lead_time_days")
    private Integer leadTimeDays;

    @Column(name = "main_material", length = 255)
    private String mainMaterial;

    @Column(name = "material_cert", length = 255)
    private String materialCert;

    @Lob
    private String description;

    @Column(name = "care_instruction", length = 1000)
    private String careInstruction;

    @Column(name = "product_url", length = 2000)
    private String productUrl;

    @Builder.Default
    @Column(name = "oem_available", nullable = false)
    private Boolean oemAvailable = false;

    @Builder.Default
    @Column(name = "sample_available", nullable = false)
    private Boolean sampleAvailable = false;

    @Builder.Default
    @Column(name = "white_label", nullable = false)
    private Boolean whiteLabel = false;

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
    @Builder.Default
    private List<ProductOption> options = new ArrayList<>();

    // ───────────────────────────────────────────
    // 수정 메서드
    // ───────────────────────────────────────────
    public void update(ProductDto.UpdateRequest request) {
        if (request.productName() != null) this.productName = request.productName();
        if (request.productEngName() != null) this.productEngName = request.productEngName();
        if (request.returnPolicy() != null) this.returnPolicy = request.returnPolicy();
        if (request.season() != null) this.season = request.season();
        if (request.moq() != null) this.moq = request.moq();
        if (request.unitPrice() != null) this.unitPrice = request.unitPrice();
        if (request.leadTimeDays() != null) this.leadTimeDays = request.leadTimeDays();
        if (request.mainMaterial() != null) this.mainMaterial = request.mainMaterial();
        if (request.materialCert() != null) this.materialCert = request.materialCert();
        if (request.description() != null) this.description = request.description();
        if (request.careInstruction() != null) this.careInstruction = request.careInstruction();
        if (request.productUrl() != null) this.productUrl = request.productUrl();
        if (request.oemAvailable() != null) this.oemAvailable = request.oemAvailable();
        if (request.sampleAvailable() != null) this.sampleAvailable = request.sampleAvailable();
        if (request.whiteLabel() != null) this.whiteLabel = request.whiteLabel();
    }
    public void increaseViewCount() {
        this.viewCount = (this.viewCount == null ? 0 : this.viewCount) + 1;
    }
}