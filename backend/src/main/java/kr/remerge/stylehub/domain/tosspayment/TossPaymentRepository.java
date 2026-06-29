package kr.remerge.stylehub.domain.tosspayment;


import kr.remerge.stylehub.domain.tosspayment.entity.TossPayments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TossPaymentRepository extends JpaRepository<TossPayments, String> {
    // paymentKey 기준으로 조회 등
    Optional<TossPayments> findByTossOrderId(String tossOrderId);

    @Modifying(clearAutomatically = true)
    @Query(value = "UPDATE orders SET order_status = :status = WHERE order_id =:orderId", nativeQuery = true)
    int forceUpdateOrderStatus(@Param("orderId") Long orderId, @Param("status") String status);

    @Query(value = "SELECT total_amount FROM orders WHERE order_id = :orderId", nativeQuery = true)
    Long findAmountByOrderId(@Param("orderId") Long orderId);
}