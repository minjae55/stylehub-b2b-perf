package kr.remerge.stylehub.domain.order.repository;

import kr.remerge.stylehub.domain.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Integer> {

    List<Order> findByBuyer_UserId(Integer userId);
}
