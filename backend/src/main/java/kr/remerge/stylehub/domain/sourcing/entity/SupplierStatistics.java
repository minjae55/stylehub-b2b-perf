package kr.remerge.stylehub.domain.sourcing.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Entity
@Table(name = "supplier_statistics")
@Getter
@NoArgsConstructor
public class SupplierStatistics {

    @Id
    @Column(name = "company_id")
    private Integer companyId;

    @Column(name = "response_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal responseRate = BigDecimal.ZERO;

    @Column(name = "total_requests", nullable = false)
    private int totalRequests = 0;

    @Column(name = "total_responses", nullable = false)
    private int totalResponses = 0;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // 배치 스케줄러에서 호출 — 통계 재계산
    public void recalculate(int totalRequests, int totalResponses) {
        this.totalRequests  = totalRequests;
        this.totalResponses = totalResponses;

        this.responseRate = totalRequests == 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(totalResponses)
                            .divide(BigDecimal.valueOf(totalRequests), 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100))
                            .setScale(2, RoundingMode.HALF_UP);
    }
}
