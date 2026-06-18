package kr.remerge.stylehub.domain.tosspayment;

import jakarta.transaction.Transactional;
import kr.remerge.stylehub.domain.order.OrderRepository;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.tosspayment.entity.Payment;
import kr.remerge.stylehub.domain.tosspayment.enumtype.PaymentStatus;
import lombok.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TossPaymentService {
    private final TossPaymentRepository paymentRepository;
    private final OrderRepository orderRepository; // 주문 정보를 가져오기 위함
    private final TossPaymentsClient tossPaymentsClient; // API 통신용 컴포넌트

    @Transactional
    public PaymentResponse confirmPayment(PaymentConfirmRequest dto) {
        // 1. 토스 페이먼츠 승인 API 호출 (외부 라이브러리/Client 호출)
        PaymentResult tossResult = tossPaymentsClient.confirm(dto);

        // 2. 주문 정보 확인
        Order order = orderRepository.findById(dto.orderId())
                .orElseThrow(() -> new IllegalArgumentException("주문 정보를 찾을 수 없습니다."));

        // 3. 결제 정보 DB 저장 (위에서 만든 Payment 엔티티 사용)
        Payment payment = Payment.builder()
                .paymentKey(dto.paymentKey())
                .orderId(String.valueOf(order.getOrderId()))
                .status(PaymentStatus.DONE)
                .amount(dto.amount())
                .method(tossResult.method()) // 토스 응답에서 결제 수단 추출
                .build();
//
        paymentRepository.save(payment);
//
//        // 4. 주문 상태 업데이트
//        order.markAsPaid();
//
//        return new PaymentResponse(payment.getPaymentKey(), order.getId(), "DONE");
        return null;
    }

//    @Transactional
//    public PaymentResponse cancelPayment(String paymentKey, PaymentCancelRequest request) {
//        // 1. DB 결제 정보 찾기
//          Payment payment = paymentRepository.findById(paymentKey)
//                .orElseThrow(() -> new IllegalArgumentException("결제 정보를 찾을 수 없습니다."))
//
//           if (payment.getStatus() == PaymentStatus.CANCELED) {
//              throw new IllegalStateException("이미 취소된 결제입니다.");
//          }
//        // 2. 토스 API 호출
//        PaymentResult tossResult = tossPaymentsClient.cancel(paymentKey, request);
//
//        // 3. 상태 업데이트
//        payment.updateStatus(PaymentStatus.CANCELED); // 엔티티에 updateStatus 메서드 추가 필요
//
//        // 4. 주문 정보 조회 후 상태 변경
//        Order order = orderRepository.findById(payment.getOrderId())
//                .orElseThrow();
//        order.cancelOrder();
//
//        return new PaymentResponse(payment.getPaymentKey(), order.getId(), "CANCELED");
//        return null;
//    }
}