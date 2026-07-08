package kr.remerge.stylehub.domain.sourcing.repository;

import io.lettuce.core.dynamic.annotation.Param;
import jakarta.persistence.Tuple;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequestItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface SourcingRequestItemRepository extends JpaRepository<SourcingRequestItem, Integer> {
    List<SourcingRequestItem> findBySourcingRequest_SourcingRequestId(Integer sourcingRequestId);

    // 여러 소싱 요청 ID들을 받아서, 각각의 총 아이템 수량 합계를 Group By로 한방에 조회
    @Query("""
            SELECT sri.sourcingRequest.sourcingRequestId AS requestId, SUM(COALESCE(sri.quantity, 0)) AS sum
            FROM SourcingRequestItem sri
            WHERE sri.sourcingRequest.sourcingRequestId IN :requestIds
            GROUP BY sri.sourcingRequest.sourcingRequestId
            """)
    List<Tuple> sumQuantityGroupedByRequestId(@Param("requestIds") Collection<Integer> requestIds);
}
