package kr.remerge.stylehub.domain.sourcing.repository;

import io.lettuce.core.dynamic.annotation.Param;
import jakarta.persistence.Tuple;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingSupplier;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingSupplierStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SourcingSupplierRepository extends JpaRepository<SourcingSupplier, Integer> {

    // 관리자 추천 목록 조회용
    List<SourcingSupplier> findAllBySourcingRequest_SourcingRequestIdAndStatus(
            Integer sourcingRequestId, SourcingSupplierStatus status);

    // 셀러 목록 조회 - company_id + status + type 필터
    // quote도 함께 fetch하여 목록 화면에서 N+1 없이 견적 요약을 바로 내려줄 수 있게 함
    @Query("""
            SELECT ss FROM SourcingSupplier ss
            JOIN FETCH ss.sourcingRequest sr
            LEFT JOIN FETCH ss.quote q
            WHERE ss.sellerCompanyId = :companyId
            AND ss.status = :status
            AND sr.type = :type
            ORDER BY sr.createdAt DESC
            """)
    List<SourcingSupplier> findSellerRequests(
            @Param("companyId") Integer companyId,
            @Param("status") SourcingSupplierStatus status,
            @Param("type") String type
    );

    // 셀러 이전 요청 조회 - DECLINED, EXPIRED
    @Query("""
            SELECT ss FROM SourcingSupplier ss
            JOIN FETCH ss.sourcingRequest sr
            LEFT JOIN FETCH ss.quote q
            WHERE ss.sellerCompanyId = :companyId
            AND ss.status IN :statuses
            AND sr.type = :type
            ORDER BY sr.createdAt DESC
            """)
    List<SourcingSupplier> findSellerPastRequests(
            @Param("companyId") Integer companyId,
            @Param("statuses") List<SourcingSupplierStatus> statuses,
            @Param("type") String type
    );

    // 배정 안 된 소싱 요청
    @Query("""
            SELECT ss FROM SourcingSupplier ss
            JOIN FETCH ss.sourcingRequest sr
            WHERE sr.sourcingRequestId NOT IN (
                SELECT ss2.sourcingRequest.sourcingRequestId
                FROM SourcingSupplier ss2
                WHERE ss2.status <> kr.remerge.stylehub.domain.sourcing.enumtype.SourcingSupplierStatus.DECLINED
            )
            ORDER BY sr.createdAt DESC
            """)
    List<SourcingSupplier> findUnassignedRequests();

    // 특정 소싱 요청의 전체 supplier 조회 (CANCELLED 체크용)
    List<SourcingSupplier> findAllBySourcingRequest_SourcingRequestId(Integer sourcingRequestId);
    List<SourcingSupplier> findBySourcingRequest_SourcingRequestId(Integer sourcingRequestId);
    // sourcingRequestId 목록에 대해 QUOTED 상태 supplier 개수를 한 번에 group by 조회
    @Query("""
            SELECT s.sourcingRequest.sourcingRequestId AS requestId, COUNT(s) AS cnt
            FROM SourcingSupplier s
            WHERE s.sourcingRequest.sourcingRequestId IN :requestIds
              AND s.status = :status
            GROUP BY s.sourcingRequest.sourcingRequestId
            """)
    List<Tuple> countByStatusGroupedByRequestId(
            @Param("requestIds") List<Integer> requestIds,
            @Param("status") SourcingSupplierStatus status
    );

    Optional<SourcingSupplier> findBySourcingRequest_SourcingRequestIdAndSellerCompanyIdAndStatusIn(Integer sourcingRequestId, Integer companyId, List<SourcingSupplierStatus> suggested);

    // SourcingSupplierRepository.java
    Optional<SourcingSupplier> findBySourcingRequest_SourcingRequestIdAndSellerCompanyId(
            Integer sourcingRequestId, Integer sellerCompanyId);
}
