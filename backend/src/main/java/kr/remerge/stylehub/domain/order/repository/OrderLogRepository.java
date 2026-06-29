package kr.remerge.stylehub.domain.order.repository;

import kr.remerge.stylehub.domain.order.entity.OrderLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderLogRepository extends JpaRepository<OrderLog, Integer> {


    List<OrderLog> findByOrder_OrderIdOrderByCreatedAtAsc(Integer orderId);

}
