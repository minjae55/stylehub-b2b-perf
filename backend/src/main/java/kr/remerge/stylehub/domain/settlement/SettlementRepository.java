package kr.remerge.stylehub.domain.settlement;

import kr.remerge.stylehub.domain.settlement.entity.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SettlementRepository extends JpaRepository<Settlement, Long> {
    // 기본적인 CRUD(save, findById 등) 메서드가 자동으로 제공됩니다.
    @Query("SELECT SUM(s.platformFee) FROM Settlement s")
    Long sumPlatformFee();

    @Query("SELECT SUM(s.totalAmount) FROM Settlement s WHERE s.status = :status")
    Long sumTotalAmountByStatus(@Param("status") String status);

    List<Settlement> findAllByOrderByCreatedAtDesc();
}