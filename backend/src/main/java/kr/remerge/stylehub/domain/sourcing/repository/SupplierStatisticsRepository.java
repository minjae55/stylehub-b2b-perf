package kr.remerge.stylehub.domain.sourcing.repository;


import kr.remerge.stylehub.domain.sourcing.entity.SupplierStatistics;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupplierStatisticsRepository extends JpaRepository<SupplierStatistics, Integer> {

    // 응답률 높은 순으로 조회 (자동 배정 우선순위용)
    List<SupplierStatistics> findAllByCompanyIdInOrderByResponseRateDesc(List<Integer> companyIds);
}
