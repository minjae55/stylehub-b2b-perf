package kr.remerge.stylehub.domain.tosspayment;


import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
import kr.remerge.stylehub.domain.tosspayment.entity.TossPayments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TossPaymentRepository extends JpaRepository<TossPayments, String> {
    // paymentKey 기준으로 조회 등
    Optional<TossPayments> findByTossOrderId(String tossOrderId);

    @Query("SELECT o.totalAmount FROM Order o WHERE o.orderNo = :orderNo")
    Long findAmountByOrderId(@Param("orderNo") String orderNo);

    // 테이블 데이터 적재 메서드
    @Modifying
    @Query(value = "INSERT INTO toss_payment_orders (toss_payment_id, order_id) VALUES (CAST(:paymentId AS CHAR), CAST(:orderNo AS CHAR))", nativeQuery = true)
    void forceInsertPaymentOrder(@Param("paymentId") String paymentId, @Param("orderNo") String orderNo);

    // 주문 상태 변경 메서드
    @Modifying
    @Query("UPDATE Order o SET o.status = :status WHERE o.orderNo = :orderNo")
    void forceUpdateOrderStatus(@Param("orderNo") String orderNo, @Param("status") OrderStatus status);
}
