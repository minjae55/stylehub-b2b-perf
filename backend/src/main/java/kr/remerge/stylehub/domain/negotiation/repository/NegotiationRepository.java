package kr.remerge.stylehub.domain.negotiation.repository;

import io.lettuce.core.dynamic.annotation.Param;
import kr.remerge.stylehub.domain.negotiation.entity.Negotiation;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface NegotiationRepository extends JpaRepository<Negotiation, Integer> {

    List<Negotiation>
    findByBuyer_UserIdOrSeller_UserIdOrderByUpdatedAtDesc(
            Integer buyerId,
            Integer sellerId
    );

    // 같은 견적/계약 + 같은 바이어라면 이전 협의가 AGREED/CLOSED로 끝났더라도
    // 상태와 무관하게 항상 같은 행(Negotiation)을 재사용하기 위한 조회.
    // (셀러 협의관리 화면에서 한 건에 대한 협의 이력이 여러 행으로 쪼개지지 않도록 함)
    Optional<Negotiation>
    findFirstByQuote_QuoteIdAndBuyer_UserIdOrderByOpenedAtDesc(
            Integer quoteId,
            Integer buyerId
    );

    Optional<Negotiation>
    findFirstByContract_ContractIdAndBuyer_UserIdOrderByOpenedAtDesc(
            Integer contractId,
            Integer buyerId
    );

    // 같은 딜(같은 견적, 같은 바이어·셀러)의 다른 타입 협의를 찾기 위한 조회.
    // 견적 협의(QUOTE)와 계약 협의(CONTRACT)는 서로 다른 행이지만, 같은 딜이면
    // 화면에서 하나의 연속된 대화로 이어 보여주기 위해 짝을 찾을 때 쓴다.
    Optional<Negotiation>
    findFirstByQuote_QuoteIdAndBuyer_UserIdAndSeller_UserIdAndNegotiationTypeOrderByOpenedAtDesc(
            Integer quoteId,
            Integer buyerId,
            Integer sellerId,
            String negotiationType
    );

    // 1. 대시보드 화면용: 최신 협의 내역 5개만 조회 (Limit 5)
    // N+1 방지를 위해 fetch join으로 buyer, seller, quote 정보를 한방에 긁어옵니다.
    @Query("""
            SELECT n FROM Negotiation n
            JOIN FETCH n.buyer b
            JOIN FETCH n.seller s
            LEFT JOIN FETCH n.quote q
            WHERE b.company.companyId = :buyerCompanyId
              AND n.status IN :statuses
              AND (:role = 'PRESIDENT' OR b.userId = :userId)
            ORDER BY n.updatedAt DESC
            """)
    List<Negotiation> findTop5BuyerNegotiations(
            @Param("buyerCompanyId") Integer buyerCompanyId,
            @Param("statuses") Collection<String> statuses,
            @Param("userId") Integer userId,
            @Param("role") String role,
            Pageable pageable
    );

    // 2. KPI 카드용: 진짜 전체 협의 진행중 건수 조회
    @Query("""
            SELECT COUNT(n) FROM Negotiation n
            JOIN n.buyer b
            WHERE b.company.companyId = :buyerCompanyId
              AND n.status IN :statuses
              AND (:role = 'PRESIDENT' OR b.userId = :userId)
            """)
    long countAllBuyerNegotiations(
            @Param("buyerCompanyId") Integer buyerCompanyId,
            @Param("statuses") Collection<String> statuses,
            @Param("userId") Integer userId,
            @Param("role") String role
    );

    // [셀러 3] 대화 및 협의 목록 조회 (sellerUserId 격리를 유지하되 안전하게 패치 조인 처리)
    @Query("""
            SELECT n FROM Negotiation n
            LEFT JOIN FETCH n.quote q
            JOIN FETCH n.buyer b
            WHERE n.seller.company.companyId = :sellerCompanyId
              AND n.status IN :statuses
              AND (:role = 'PRESIDENT' OR n.seller.userId = :sellerUserId)
            ORDER BY n.updatedAt DESC
            """)
    List<Negotiation> findTop5SellerNegotiations(
            @Param("sellerCompanyId") Integer sellerCompanyId,
            @Param("statuses") Collection<String> statuses,
            @Param("sellerUserId") Integer sellerUserId,
            @Param("role") String role,
            Pageable pageable
    );
}
