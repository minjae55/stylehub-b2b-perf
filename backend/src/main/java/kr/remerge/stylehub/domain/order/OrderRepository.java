package kr.remerge.stylehub.domain.order;

import kr.remerge.stylehub.domain.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Integer> {

}
