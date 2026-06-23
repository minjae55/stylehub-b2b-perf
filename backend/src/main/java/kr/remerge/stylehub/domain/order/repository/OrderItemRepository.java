package kr.remerge.stylehub.domain.order.repository;

import kr.remerge.stylehub.domain.order.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {

}
