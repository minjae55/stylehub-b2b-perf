package kr.remerge.stylehub.domain.order.repository;

import io.lettuce.core.dynamic.annotation.Param;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Integer> {

    List<Order> findByBuyer_UserIdOrderByCreatedAtDesc(Integer userId);

    Optional<Order> findByOrderIdAndBuyer_UserId(Integer orderId, Integer userId);

    Optional<Order>
    findFirstByContract_ContractIdAndBuyer_UserIdAndStatusOrderByCreatedAtDesc(
            Integer contractId,
            Integer buyerId,
            OrderStatus status
    );

    List<Order> findByOrderIdInAndBuyer_UserId(List<Integer> orderIds, Integer userId);

    List<Order> findBySellerCompany_CompanyIdOrderByCreatedAtDesc(Integer companyId);

    @Query("""
    select count(o) > 0
    from Order o
    where o.quote.quoteId = :quoteId
      and o.buyer.userId = :buyerId
      and o.isSample = true
      and o.status in :statuses
    """)
    boolean existsActiveSampleOrder(
            @Param("quoteId") Integer quoteId,
            @Param("buyerId") Integer buyerId,
            @Param("statuses") List<OrderStatus> statuses
    );

    @Query("""
    select count(o) > 0
    from Order o
    where o.contract.contractId = :contractId
      and o.buyer.userId = :buyerId
      and o.isSample = false
      and o.status in :statuses
    """)
    boolean existsActiveContractOrder(
            @Param("contractId") Integer contractId,
            @Param("buyerId") Integer buyerId,
            @Param("statuses") List<OrderStatus> statuses
    );

    List<Order> findByOrderNoInAndBuyer_UserId(List<String> orderNos, Integer userId);

    @EntityGraph(attributePaths = "quote")
    List<Order> findByQuote_QuoteIdInAndBuyer_UserIdAndIsSampleTrueOrderByCreatedAtDesc(
            List<Integer> quoteIds,
            Integer buyerId
    );

    // 바이어 견적 목록에서 "이미 본주문 결제까지 끝난 계약인지"를 판단해 결제 버튼을
    // 계속 노출하지 않도록 하기 위함 (샘플 주문 조회와 동일한 패턴).
    @EntityGraph(attributePaths = "quote")
    List<Order> findByQuote_QuoteIdInAndBuyer_UserIdAndIsSampleFalseOrderByCreatedAtDesc(
            List<Integer> quoteIds,
            Integer buyerId
    );

    // 협의 목록 화면에서 "이 협의 건으로 샘플 주문이 이미 생성됐는지"를 배지/링크로 보여주기 위해
    // 바이어 제한 없이 quoteId 목록으로 샘플 주문을 한 번에 조회한다.
    @EntityGraph(attributePaths = "quote")
    List<Order> findByQuote_QuoteIdInAndIsSampleTrueOrderByCreatedAtDesc(
            List<Integer> quoteIds
    );

    Optional<Order> findOneByOrderId(Integer orderId);

    List<Order> findByOrderNoIn(List<String> orderNos);

    // 여러 OrderStatus 조건(IN)에 맞는 주문 최신 5개 조회 (Limit 5)
    @Query("""
            
                    SELECT o FROM Order o
                    JOIN FETCH o.buyer b
                    JOIN FETCH o.sellerCompany c
                    WHERE b.company.companyId = :buyerCompanyId
              AND o.status IN :statuses
              AND (:role = 'PRESIDENT' OR b.userId = :userId)
                    ORDER BY o.createdAt DESC
            """)
    List<Order> findTop5BuyerOrders(
            @Param("buyerCompanyId") Integer buyerCompanyId,
            @Param("statuses") Collection<OrderStatus> statuses,
            @Param("userId") Integer userId,
            @Param("role") String role,
            Pageable pageable
    );

    // 여러 OrderStatus 조건(IN)에 맞는 주문의 전체 총 건수 조회
    @Query("""
            
                    SELECT COUNT(o) FROM Order o
            JOIN o.buyer b
            WHERE b.company.companyId = :buyerCompanyId
              AND (:role = 'PRESIDENT' OR b.userId = :userId)
              AND o.status IN :statuses
            """)
    long countAllBuyerOrders(
            @Param("buyerCompanyId") Integer buyerCompanyId,
            @Param("statuses") Collection<OrderStatus> statuses,
            @Param("userId") Integer userId,
            @Param("role") String role
    );

    // 임박 주문
    @Query("""
            SELECT o FROM Order o
            JOIN FETCH o.buyer b
            LEFT JOIN FETCH o.sellerCompany c
            WHERE b.userId = :buyerId
              AND o.status IN :statuses
              AND o.deliveredAt <= :urgentThresholdDate
            ORDER BY o.deliveredAt ASC
            """)
    List<Order> findTop5UrgentReceipts(
            @Param("buyerId") Integer buyerId,
            @Param("statuses") Collection<OrderStatus> statuses,
            @Param("urgentThresholdDate") LocalDateTime urgentThresholdDate,
            Pageable pageable
    );

    // [셀러 4, 5, 7] 주문 및 정산 내역 조회 (회사 ID 기준)
    @Query("""
            SELECT o FROM Order o
            JOIN FETCH o.buyer b
            WHERE o.sellerCompany.companyId = :sellerCompanyId
              AND o.status IN :statuses
            ORDER BY o.createdAt DESC
            """)
    List<Order> findTop5SellerOrders(
            @Param("sellerCompanyId") Integer sellerCompanyId,
            @Param("statuses") Collection<OrderStatus> statuses,
            Pageable pageable
    );
}
