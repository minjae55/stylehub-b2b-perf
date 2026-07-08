package kr.remerge.stylehub.domain.sourcing.repository;

import io.lettuce.core.dynamic.annotation.Param;
import jakarta.persistence.Tuple;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface SourcingRequestRepository extends JpaRepository<SourcingRequest, Integer> {
    List<SourcingRequest> findByBuyer_UserIdAndTypeOrderByCreatedAtDesc(Integer buyerId, String type);

    // 대표 전용 - 회사 전체 요청 조회
    List<SourcingRequest> findByBuyerCompanyIdAndTypeOrderByCreatedAtDesc(Integer buyerCompanyId, String type);

    // 직원 전용 - 본인이 작성한 요청만 조회
    List<SourcingRequest> findByBuyerCompanyIdAndTypeAndBuyer_UserIdOrderByCreatedAtDesc(
            Integer buyerCompanyId, String type, Integer userId);

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

    // [바이어 대시보드 전용 신규 쿼리]
    // 회사 ID + 상태 조건에 맞으면서, 대표(PRESIDENT)거나 본인이 작성한 소싱 요청 중 최신 5개만 조회
    @Query("""
            SELECT sr FROM SourcingRequest sr
            WHERE sr.buyerCompanyId = :buyerCompanyId
              AND sr.status IN :statuses
              AND (:role = 'PRESIDENT' OR sr.buyer.userId = :userId)
            ORDER BY sr.createdAt DESC
            """)
    List<SourcingRequest> findTop5BuyerDashboardFeeds(
            @Param("buyerCompanyId") Integer buyerCompanyId,
            @Param("statuses") Collection<SourcingStatus> statuses,
            @Param("userId") Integer userId,
            @Param("role") String role,
            Pageable pageable // 💡 딱 5개만 끊어오기 위한 페이징 파라미터
    );

    // 2. 상단 카운트 카드에 뿌려줄 '진짜 전체 대기중 건수' 세어오기 (COUNT 전용)
    @Query("""
            SELECT COUNT(sr) FROM SourcingRequest sr
            WHERE sr.buyerCompanyId = :buyerCompanyId
              AND sr.status IN :statuses
              AND (:role = 'PRESIDENT' OR sr.buyer.userId = :userId)
            """)
    long countAllBuyerDashboardFeeds(
            @Param("buyerCompanyId") Integer buyerCompanyId,
            @Param("statuses") Collection<SourcingStatus> statuses,
            @Param("userId") Integer userId,
            @Param("role") String role
    );
}