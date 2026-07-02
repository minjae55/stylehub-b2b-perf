package kr.remerge.stylehub.domain.sourcing.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.sourcing.enumtype.SupplierSourcingType;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "supplier_profile")
@Getter
@NoArgsConstructor
public class SupplierProfile {

    @Id
    @Column(name = "company_id")
    private Integer companyId;

    @Enumerated(EnumType.STRING)
    @Column(name = "sourcing_type", nullable = false, length = 10)
    private SupplierSourcingType sourcingType = SupplierSourcingType.NONE;

    @Column(name = "auto_assign_enabled", nullable = false)
    private boolean autoAssignEnabled = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // 아직 프로필 행이 없는 셀러(첫 설정)를 위한 기본값 생성
    public static SupplierProfile createDefault(Integer companyId) {
        SupplierProfile profile = new SupplierProfile();
        profile.companyId = companyId;
        profile.sourcingType = SupplierSourcingType.NONE;
        profile.autoAssignEnabled = false;
        return profile;
    }

    // 자동 배정 ON/OFF 토글
    public void toggleAutoAssign(boolean enabled) {
        this.autoAssignEnabled = enabled;
    }

    // 받을 소싱 타입 변경 (NONE / READY / CUSTOM / BOTH)
    public void changeSourcingType(SupplierSourcingType sourcingType) {
        this.sourcingType = sourcingType;
    }

    // sourcing_type이 요청 타입과 호환되는지 체크
    // requestType: "READY" or "CUSTOM"
    public boolean isCompatibleWith(String requestType) {
        if (this.sourcingType == SupplierSourcingType.BOTH) return true;
        return this.sourcingType.name().equals(requestType);
    }
}
