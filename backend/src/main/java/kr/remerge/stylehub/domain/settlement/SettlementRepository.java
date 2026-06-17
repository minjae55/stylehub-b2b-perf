package kr.remerge.stylehub.domain.settlement;

import kr.remerge.stylehub.domain.settlement.entity.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SettlementRepository extends JpaRepository<Settlement, Long> {
    // 기본적인 CRUD(save, findById 등) 메서드가 자동으로 제공됩니다.
}