package kr.remerge.stylehub.domain.order.repository;

import io.lettuce.core.dynamic.annotation.Param;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

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

    @EntityGraph(attributePaths = {
            "buyer",
            "sellerCompany"
    })
    Optional<Order> findOneByOrderId(Integer orderId);
    List<Order> findByOrderNoIn(List<String> orderNos);
}
