package kr.remerge.stylehub.domain.sourcing.repository;

import io.lettuce.core.dynamic.annotation.Param;
import jakarta.persistence.Tuple;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface SourcingRequestRepository extends JpaRepository<SourcingRequest, Integer> {
    List<SourcingRequest> findByBuyer_UserIdAndTypeOrderByCreatedAtDesc(Integer buyerId, String type);

    // 회사 단위 조회 (대표/직원 구분 없이 같은 회사 buyer면 전체 조회)
    List<SourcingRequest> findByBuyerCompanyIdAndTypeOrderByCreatedAtDesc(Integer buyerCompanyId, String type);

    List<SourcingRequest> findByBuyerCompanyIdAndTypeAndStatusInOrderByCreatedAtDesc(
            Integer buyerCompanyId, String type, List<SourcingStatus> statuses);

    @Query("""
    SELECT r.status as status, COUNT(r) as cnt
    FROM SourcingRequest r
    WHERE r.buyerCompanyId = :buyerCompanyId AND r.type = :type
    GROUP BY r.status
""")
    List<Tuple> countGroupedByStatus(@Param("buyerCompanyId") Integer buyerCompanyId, @Param("type") String type);

    // 관리자용 - 전체 소싱 요청 조회 (회사 무관), 그룹 필터(여러 status)용
    List<SourcingRequest> findAllByOrderByCreatedAtDesc();

    List<SourcingRequest> findAllByStatusInOrderByCreatedAtDesc(List<SourcingStatus> statuses);

    // 관리자용 - 전체 소싱 요청 상태별 통계 (회사 무관)
    @Query("""
        SELECT r.status as status, COUNT(r) as cnt
        FROM SourcingRequest r
        GROUP BY r.status
        """)
    List<Tuple> countAllGroupedByStatus();

    List<SourcingRequest> findByBuyerCompanyIdAndStatusInOrderByCreatedAtDesc(
            Integer buyerCompanyId,
            Collection<SourcingStatus> statuses
    );
}