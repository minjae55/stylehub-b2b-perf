package kr.remerge.stylehub.domain.company.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.global.entity.BaseEntity;
import lombok.*;

@Entity
@Table(name = "brands")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Brand extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "brand_id")
    private Integer brandId;

    // 브랜드 소유 회사
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "brand_name", nullable = false, length = 100)
    private String brandName;

    @Column(name = "brand_logo_url", length = 2000)
    private String brandLogoUrl;

    // ───────────────────────────────────────────
    // 상태 변경 메서드
    // ───────────────────────────────────────────

    // 브랜드명 수정
    public void updateName(String brandName) {
        this.brandName = brandName;
    }

    // 브랜드 로고 수정
    public void updateLogoUrl(String brandLogoUrl) {
        this.brandLogoUrl = brandLogoUrl;
    }
}