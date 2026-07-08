package kr.remerge.stylehub.domain.sourcing.repository;

import io.lettuce.core.dynamic.annotation.Param;
import jakarta.persistence.Tuple;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingSupplier;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingStatus;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingSupplierStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SourcingSupplierRepository extends JpaRepository<SourcingSupplier, Integer> {

    // 관리자 추천 목록 조회용
    List<SourcingSupplier> findAllBySourcingRequest_SourcingRequestIdAndStatus(
            Integer sourcingRequestId, SourcingSupplierStatus status);

    // 셀러 목록 조회 - company_id + status + type 필터
    // quote도 함께 fetch하여 목록 화면에서 N+1 없이 견적 요약을 바로 내려줄 수 있게 함
    // 견적(quote)이 아직 없으면(=담당자 미지정) 회사 전체 공개, 있으면 작성자 본인 또는 대표만 조회 가능
    @Query("""
            SELECT ss FROM SourcingSupplier ss
            JOIN FETCH ss.sourcingRequest sr
            LEFT JOIN FETCH ss.quote q
            WHERE ss.sellerCompanyId = :companyId
            AND ss.status = :status
            AND sr.type = :type
            AND (:role = 'PRESIDENT' OR q IS NULL OR q.seller.userId = :userId)
            ORDER BY sr.createdAt DESC
            """)
    List<SourcingSupplier> findSellerRequests(
            @Param("companyId") Integer companyId,
            @Param("status") SourcingSupplierStatus status,
            @Param("type") String type,
            @Param("userId") Integer userId,
            @Param("role") String role
    );

    // 셀러 이전 요청 조회 - DECLINED, EXPIRED (구버전, 현재 서비스에서 미사용 - quoteEndedStatuses 포함 버전으로 대체됨)
    @Query("""
            SELECT ss FROM SourcingSupplier ss
            JOIN FETCH ss.sourcingRequest sr
            LEFT JOIN FETCH ss.quote q
            WHERE ss.sellerCompanyId = :companyId
            AND ss.status IN :statuses
            AND sr.type = :type
            """)
    List<SourcingSupplier> findSellerPastRequests(
            @Param("companyId") Integer companyId,
            @Param("statuses") List<SourcingSupplierStatus> statuses,
            @Param("type") String type
    );

    // 배정 안 된 소싱 요청
    // 활성 상태(SUGGESTED/RECOMMENDED/QUOTED)인 공급사가 하나도 없는 요청만 미배정으로 취급.
    // DECLINED뿐 아니라 REJECTED/EXPIRED/CANCELLED도 "더 이상 유효하지 않은 배정"이므로 함께 제외해야 함.
    @Query("""
            SELECT ss FROM SourcingSupplier ss
            JOIN FETCH ss.sourcingRequest sr
            WHERE sr.sourcingRequestId NOT IN (
                SELECT ss2.sourcingRequest.sourcingRequestId
                FROM SourcingSupplier ss2
                WHERE ss2.status NOT IN (
                    kr.remerge.stylehub.domain.sourcing.enumtype.SourcingSupplierStatus.DECLINED,
                    kr.remerge.stylehub.domain.sourcing.enumtype.SourcingSupplierStatus.REJECTED,
                    kr.remerge.stylehub.domain.sourcing.enumtype.SourcingSupplierStatus.EXPIRED,
                    kr.remerge.stylehub.domain.sourcing.enumtype.SourcingSupplierStatus.CANCELLED
                )
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

    // SUGGESTED 상태 후보가 있는 sourcingRequestId + 그 개수를 함께 조회 (관리자 승인 대기 큐)
    @Query("""
        SELECT s.sourcingRequest.sourcingRequestId as requestId, COUNT(s) as cnt
        FROM SourcingSupplier s
        WHERE s.status = :status
        GROUP BY s.sourcingRequest.sourcingRequestId
        """)
    List<Tuple> countByStatusGroupedByRequest(@Param("status") SourcingSupplierStatus status);

    Optional<SourcingSupplier> findBySourcingRequest_SourcingRequestIdAndSellerCompanyIdAndStatusIn(Integer sourcingRequestId, Integer companyId, List<SourcingSupplierStatus> suggested);

    // SourcingSupplierRepository.java
    Optional<SourcingSupplier> findBySourcingRequest_SourcingRequestIdAndSellerCompanyId(
            Integer sourcingRequestId, Integer sellerCompanyId);

    // 셀러 완료 목록 조회 - 견적이 승인(APPROVED)된 건
    // APPROVED는 항상 quote가 존재하므로(작성자가 확정된 상태) 작성자 본인 또는 대표만 조회 가능
    @Query("""
        SELECT ss FROM SourcingSupplier ss
        JOIN FETCH ss.sourcingRequest sr
        JOIN ss.quote q
        WHERE ss.sellerCompanyId = :companyId
        AND ss.status = kr.remerge.stylehub.domain.sourcing.enumtype.SourcingSupplierStatus.QUOTED
        AND q.status = :quoteStatus
        AND sr.type = :type
        AND (:role = 'PRESIDENT' OR q.seller.userId = :userId)
        ORDER BY sr.createdAt DESC
        """)
    List<SourcingSupplier> findSellerCompletedRequests(
            @Param("companyId") Integer companyId,
            @Param("quoteStatus") String quoteStatus,
            @Param("type") String type,
            @Param("userId") Integer userId,
            @Param("role") String role
    );

    // 1. 대시보드 화면용: 조건에 맞는 받은 견적 내역 최신 5개만 조회 (Limit 5)
    @Query("""
            SELECT ss FROM SourcingSupplier ss
            JOIN FETCH ss.sourcingRequest sr
            JOIN FETCH ss.quote q
            WHERE sr.buyerCompanyId = :buyerCompanyId
              AND sr.status IN :statuses
              AND (:role = 'PRESIDENT' OR sr.buyer.userId = :userId)
            """)
    List<SourcingSupplier> findTop5ReceivedQuotes(
            @Param("buyerCompanyId") Integer buyerCompanyId,
            @Param("statuses") Collection<SourcingStatus> statuses,
            @Param("userId") Integer userId,
            @Param("role") String role,
            Pageable pageable
    );

    // 2. KPI 카드용: 조건에 맞는 받은 견적의 '전체 총 건수' 조회
    @Query("""
            SELECT COUNT(ss) FROM SourcingSupplier ss
            JOIN ss.sourcingRequest sr
            WHERE sr.buyerCompanyId = :buyerCompanyId
              AND sr.status IN :statuses
              AND ss.quote IS NOT NULL
              AND (:role = 'PRESIDENT' OR sr.buyer.userId = :userId)
            """)
    long countAllReceivedQuotes(
            @Param("buyerCompanyId") Integer buyerCompanyId,
            @Param("statuses") Collection<SourcingStatus> statuses,
            @Param("userId") Integer userId,
            @Param("role") String role
    );

    // 셀러 이전 요청 조회 - 배정 자체가 DECLINED/EXPIRED/CANCELLED 이거나, 견적이 REJECTED/NOT_SELECTED된 건
    // 견적이 없으면(=담당자 미지정) 회사 전체 공개, 있으면 작성자 본인 또는 대표만 조회 가능
    @Query("""
        SELECT ss FROM SourcingSupplier ss
        JOIN FETCH ss.sourcingRequest sr
        LEFT JOIN FETCH ss.quote q
        WHERE ss.sellerCompanyId = :companyId
        AND (
            ss.status IN :statuses
            OR q.status IN :quoteEndedStatuses
        )
        AND sr.type = :type
        AND (:role = 'PRESIDENT' OR q IS NULL OR q.seller.userId = :userId)
        ORDER BY sr.createdAt DESC
        """)
    List<SourcingSupplier> findSellerPastRequests(
            @Param("companyId") Integer companyId,
            @Param("statuses") List<SourcingSupplierStatus> statuses,
            @Param("quoteEndedStatuses") List<String> quoteEndedStatuses,
            @Param("type") String type,
            @Param("userId") Integer userId,
            @Param("role") String role
    );

    // [셀러 1] 신규 소싱 요청 피드 조회 (회사 ID 기준)
    @Query("""
            SELECT ss FROM SourcingSupplier ss
            JOIN FETCH ss.sourcingRequest sr
            WHERE ss.sellerCompanyId = :sellerCompanyId
              AND ss.status = :status
            ORDER BY sr.createdAt DESC
            """)
    List<SourcingSupplier> findTop5SellerFeeds(
            @Param("sellerCompanyId") Integer sellerCompanyId,
            @Param("status") SourcingSupplierStatus status,
            Pageable pageable
    );

    // [셀러 2] 작성 중이거나 마감 임박인 견적서 조회 (회사 ID 기준)
    @Query("""
            SELECT ss FROM SourcingSupplier ss
            JOIN FETCH ss.sourcingRequest sr
            WHERE ss.sellerCompanyId = :sellerCompanyId
              AND ss.status = :status
            ORDER BY sr.expiryDate ASC
            """)
    List<SourcingSupplier> findTop5SellerQuoteDrafts(
            @Param("sellerCompanyId") Integer sellerCompanyId,
            @Param("status") SourcingSupplierStatus status,
            Pageable pageable
    );
}