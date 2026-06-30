package kr.remerge.stylehub.domain.tosspayment;

import jakarta.transaction.Transactional;
import kr.remerge.stylehub.domain.order.repository.OrderRepository;
import kr.remerge.stylehub.domain.tosspayment.entity.TossPayments;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.OffsetDateTime;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TossPaymentService {
    private final TossPaymentRepository tosspaymentRepository;
    private final TossPaymentsClient tossPaymentsClient;
    private final OrderRepository orderRepository; // 💡 Order 조회를 위해 올바르게 주입

    @Transactional
    public PaymentResponse confirmPayment(PaymentConfirmRequest dto) {
        try {
            PaymentResult tossResult = tossPaymentsClient.confirm(dto);
            if ( dto.orderIds().size() > 1 ) {
                confirmGroupPayment(dto);
            }

            TossPayments tossPayments = TossPayments.builder()
                    .tossPaymentId(dto.paymentKey())
                    .tossOrderId(dto.orderId())
                    .status("DONE")
                    .amount(dto.amount())
                    .method(tossResult.method())
                    .requestedAt(LocalDateTime.now())
                    .approvedAt(OffsetDateTime.parse(tossResult.approvedAt()).toLocalDateTime())
                    .build();

            tosspaymentRepository.save(tossPayments);
            return new PaymentResponse(tossPayments.getTossPaymentId(), tossPayments.getTossOrderId(), "DONE");

        } catch (TossPaymentsClient.AlreadyProcessedPaymentException e) {
            // 이미 승인된 결제 → DB에서 기존 레코드 조회해서 반환
            log.warn("이미 처리된 결제입니다. paymentKey={}", dto.paymentKey());
            TossPayments existing = tosspaymentRepository.findById(dto.paymentKey())
                    .orElseThrow(() -> new RuntimeException("결제는 완료됐으나 DB에 기록이 없습니다."));
            return new PaymentResponse(existing.getTossPaymentId(), existing.getTossOrderId(), existing.getStatus());

        } catch (Exception e) {
            log.error("토스 결제 승인 중 에러 발생", e);
            throw e;
        }
    }


    @Transactional
    public PaymentResponse confirmGroupPayment(PaymentConfirmRequest dto) {
        // DTO 내부에서 실제 가공할 진짜 개별 주문 PK 리스트를 추출
        List<Long> actualOrderIds = dto.orderIds();

        if (actualOrderIds == null || actualOrderIds.isEmpty()) {
            throw new IllegalArgumentException("묶어서 처리할 하위 개별 주문 ID(orderIds) 목록이 비어있습니다.");
        }

        try {
            // ── [1단계] 금액 변조 및 유효성 강제 검증 ──
            long totalDbAmount = 0;
            for (Long orderId : actualOrderIds) {
                // Order 엔티티 대신 네이티브 쿼리로 장바구니 개별 가격들을 직접 수집
                Long orderAmount = tosspaymentRepository.findAmountByOrderId(orderId);
                if (orderAmount == null) {
                    throw new IllegalArgumentException("DB에 존재하지 않는 무효한 주문 ID가 감지되었습니다 ID: " + orderId);
                }
                totalDbAmount += orderAmount;
            }

            // 프론트가 전송한 결제 총금액과 DB 내부 원본 단가 총합이 일치하는지 더블 체크
            if (totalDbAmount != dto.amount()) {
                throw new IllegalStateException("결제 위변조 의심: 요청 금액과 DB 실 주문액 총합이 불일치합니다.");
            }

            // ── [2단계] 외부 토스 API 통신 완료 처리 ──
            PaymentResult tossResult = tossPaymentsClient.confirm(dto);

            TossPayments tossPayments = TossPayments.builder()
                    .tossPaymentId(dto.paymentKey())
                    .tossOrderId(dto.orderId())
                    .status("DONE")
                    .amount(dto.amount())
                    .method(tossResult.method())
                    .requestedAt(LocalDateTime.now())
                    .approvedAt(OffsetDateTime.parse(tossResult.approvedAt()).toLocalDateTime())
                    // 💡 레포지토리로 직접 넣을 거라면 엔티티 내 .orderIds(actualOrderIds) 빌더 필드는 빼두거나 유지해도 무방합니다.
                    .build();

            tosspaymentRepository.save(tossPayments);

            // ── [4단계] 루프 안에서 매핑 테이블 데이터 적재와 상태 변경을 한 번에 처리 ──
            for (Long orderId : actualOrderIds) {
                // 1. 💡 매핑 테이블(toss_payment_orders)에 강제 직접 인서트
                tosspaymentRepository.forceInsertPaymentOrder(tossPayments.getTossPaymentId(), orderId);

                // 2. 기존 orders 테이블 상태 APPROVED 변경
                tosspaymentRepository.forceUpdateOrderStatus(orderId, "APPROVED");
            }

            return new PaymentResponse(tossPayments.getTossPaymentId(), tossPayments.getTossOrderId(), "DONE");

        } catch (TossPaymentsClient.AlreadyProcessedPaymentException e) {
            log.warn("이미 처리 완료된 그룹 결제 건입니다. paymentKey={}", dto.paymentKey());
            TossPayments existing = tosspaymentRepository.findById(dto.paymentKey())
                    .orElseThrow(() -> new RuntimeException("결제는 완료됐으나 DB에 기록이 없습니다."));
            return new PaymentResponse(existing.getTossPaymentId(), existing.getTossOrderId(), existing.getStatus());

        } catch (Exception e) {
            log.error("그룹 결제 승인 처리 중 치명적 예외 발생", e);
            throw e;
        }
    }

    @Transactional
    public PaymentResponse cancelPayment(String paymentKey, PaymentCancelRequest request) {
        TossPayments tossPayments = tosspaymentRepository.findById(paymentKey)
                .orElseThrow(() -> new IllegalArgumentException("결제 정보를 찾을 수 없습니다."));

        tossPaymentsClient.cancel(paymentKey, request);
//        tossPayments.updateStatus(PaymentStatus.CANCELED);

        return new PaymentResponse(tossPayments.getTossPaymentId(), tossPayments.getTossOrderId(), "CANCELED");
    }
}