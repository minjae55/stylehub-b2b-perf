package kr.remerge.stylehub.domain.company.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "company_handled_categories",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_company_category",
                        columnNames = {"company_id", "category_id"}
                )
        },
        indexes = {
                @Index(name = "idx_company_id", columnList = "company_id"),
                @Index(name = "idx_category_id", columnList = "category_id")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class CompanyHandledCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "company_handled_category_id")
    private Integer id;

    // 연관 관계 매핑 (필요에 따라 FetchType.LAZY 설정)
    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(name = "category_id", nullable = false)
    private Integer categoryId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
