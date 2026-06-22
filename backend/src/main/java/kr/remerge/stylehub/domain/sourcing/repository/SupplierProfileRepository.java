package kr.remerge.stylehub.domain.sourcing.repository;


import kr.remerge.stylehub.domain.sourcing.entity.SupplierProfile;
import kr.remerge.stylehub.domain.sourcing.enumtype.SupplierSourcingType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupplierProfileRepository extends JpaRepository<SupplierProfile, Integer> {

    // 자동 배정 활성화된 공급사만
    List<SupplierProfile> findAllByAutoAssignEnabledTrue();

    // 자동 배정 활성화 + 특정 소싱타입 호환 (BOTH 포함)
    List<SupplierProfile> findAllByAutoAssignEnabledTrueAndSourcingTypeIn(List<SupplierSourcingType> types);
}
