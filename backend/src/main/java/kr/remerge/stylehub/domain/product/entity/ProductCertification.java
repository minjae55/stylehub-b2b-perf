package kr.remerge.stylehub.domain.product.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_certification")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ProductCertification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer productCertificationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "cert_name", nullable = false, length = 100)
    private String certName;

    @Column(name = "file_url", nullable = false, length = 2000)
    private String fileUrl;

    @Column(name = "expiry_year", length = 4)
    private Integer expiryYear;

    @Column(name = "expiry_month", length = 2)
    private Integer expiryMonth;
}