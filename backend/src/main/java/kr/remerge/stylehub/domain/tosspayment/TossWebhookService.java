package kr.remerge.stylehub.domain.tosspayment;

import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.repository.OrderRepository;
import kr.remerge.stylehub.domain.order.service.OrderStatusService;
import kr.remerge.stylehub.domain.tosspayment.entity.TossPayments;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TossWebhookService {

    private final TossPaymentsClient tossPaymentsClient;
    private final TossPaymentRepository tossPaymentRepository;
    private final OrderRepository orderRepository;
    private final OrderStatusService orderStatusService;

    @Transactional
    public void handle(TossWebhookPayload payload) {
        // 1. 토스 API로 재조회하여 검증
        PaymentResult verified = tossPaymentsClient.retrievePayment(payload.data().paymentKey());

        if (!"DONE".equals(verified.status())) {
            log.info("입금 미완료 상태, 스킵: status={}", verified.status());
            return;
        }

        // 2. 우리 DB에서 가상계좌 결제 정보 조회
        TossPayments payment = tossPaymentRepository.findById(verified.paymentKey())
                .orElseThrow(() -> new IllegalArgumentException("결제 정보를 찾을 수 없습니다."));

        if ("DONE".equals(payment.getStatus())) {
            log.info("이미 처리된 결제, 스킵: paymentKey={}", verified.paymentKey());
            return; // 중복 웹훅 방어
        }

        // 3. 엔티티에 저장되어 있는 주문 번호(orderIds) 추출
        List<String> orderNos = payment.getOrderIds();

        // 4. 유저 식별자 없이 주문 번호 리션을 통해 전체 주문 바로 조회
        List<Order> orders = orderRepository.findByOrderNoIn(orderNos);

        if (orders.isEmpty()) {
            throw new IllegalArgumentException("해당 결제에 매핑된 주문을 찾을 수 없습니다.");
        }

        // 5. 주문 상태 완료 처리 (주문 엔티티 내부의 buyer 객체를 활용)
        orderStatusService.confirmPayments(orders, orders.get(0).getBuyer());

        // 6. 엔티티 내부 도메인 메서드로 결제 상태 변경 (JPA 변경 감지로 자동 반영)
        LocalDateTime approvedAt = verified.approvedAt() != null
                ? OffsetDateTime.parse(verified.approvedAt()).toLocalDateTime()
                : LocalDateTime.now(); // 만약 토스 응답에 없으면 현재 시간 스냅샷

        payment.markAsDone(approvedAt);

        log.info("가상계좌 웹훅 입금 및 주문 승인 완료: paymentKey={}, orderCount={}", verified.paymentKey(), orders.size());
    }
}