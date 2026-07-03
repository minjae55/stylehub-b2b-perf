package kr.remerge.stylehub.domain.order.repository;

import io.lettuce.core.dynamic.annotation.Param;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Integer> {

    List<Order> findByBuyer_UserIdOrderByCreatedAtDesc(Integer userId);

    Optional<Order> findByOrderIdAndBuyer_UserId(Integer orderId, Integer userId);

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

    List<Order> findByOrderNoInAndBuyer_UserId(List<String> orderNos, Integer userId);
}
