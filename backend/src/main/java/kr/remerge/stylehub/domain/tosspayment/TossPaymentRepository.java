package kr.remerge.stylehub.domain.tosspayment;


import kr.remerge.stylehub.domain.tosspayment.entity.TossPayments;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TossPaymentRepository extends JpaRepository<TossPayments, String> {
    // paymentKey 기준으로 조회 등
}