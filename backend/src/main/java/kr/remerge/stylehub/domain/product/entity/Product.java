package kr.remerge.stylehub.domain.product.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.company.entity.Brand;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.global.entity.BaseEntity;
import lombok.*;

import java.time.LocalDateTime;

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

    @Lob
    @Column(name = "care_instruction")
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
}
