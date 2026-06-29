package kr.remerge.stylehub.domain.order.repository;

import kr.remerge.stylehub.domain.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Integer> {

    List<Order> findByBuyer_UserIdOrderByCreatedAtDesc(Integer userId);

    Optional<Order> findByOrderIdAndBuyer_UserId(Integer orderId, Integer userId);

    List<Order> findByOrderIdInAndBuyer_UserId(List<Integer> orderIds, Integer userId);
}
