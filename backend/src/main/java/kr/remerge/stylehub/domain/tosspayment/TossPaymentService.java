package kr.remerge.stylehub.domain.tosspayment;

import jakarta.transaction.Transactional;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
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
    private final OrderRepository orderRepository;

    @Transactional
    public PaymentResponse confirmPayment(PaymentConfirmRequest dto) {
        try {
            log.info("▶ [서비스] 단건 결제 처리 시작 - orderId: {}", dto.orderId());

            // 1. 외부 토스 API 통신 완료 처리
            PaymentResult tossResult = tossPaymentsClient.confirm(dto);

            // 2. 단건 결제 정보 DB 적재
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
            log.warn("이미 처리된 결제입니다. paymentKey={}", dto.paymentKey());
            TossPayments existing = tosspaymentRepository.findById(dto.paymentKey())
                    .orElseThrow(() -> new RuntimeException("결제는 완료됐으나 DB에 기록이 없습니다."));
            return new PaymentResponse(existing.getTossPaymentId(), existing.getTossOrderId(), existing.getStatus());

        } catch (Exception e) {
            log.error("토스 결제 승인 중 에러 발생", e);
            throw e;
        }
    }

    /**
     * [그룹(묶음) 결제 승인 및 처리]
     * 💡 DTO의 orderIds가 List<String> 구조로 변환됨에 따라 내부 바인딩 로직 안정화
     */
    @Transactional
    public PaymentResponse confirmGroupPayment(PaymentConfirmRequest dto) {
        log.info("▶ [서비스] 그룹 결제 처리 시작 - orderId(대표): {}", dto.orderId());

        // 🌟 List<String> 타입으로 유연하게 수용 (Jackson 역직렬화 에러 완전 방지)
        List<String> actualOrderNos = dto.orderIds();

        if (actualOrderNos == null || actualOrderNos.isEmpty()) {
            throw new IllegalArgumentException("묶어서 처리할 하위 개별 주문 번호(orderIds) 목록이 비어있습니다.");
        }

        try {
            // ── [1단계] 금액 변조 및 유효성 강제 검증 ──
            long totalDbAmount = 0;
            for (String orderNo : actualOrderNos) {
                // 만약 Repository가 orderNo(문자열) 기반 조회를 지원한다면 그대로 활용, PK(Long) 기반이라면 변환 필요
                Long orderAmount = tosspaymentRepository.findAmountByOrderId(orderNo);
                if (orderAmount == null) {
                    throw new IllegalArgumentException("DB에 존재하지 않는 무효한 주문 번호가 감지되었습니다 No: " + orderNo);
                }
                totalDbAmount += orderAmount;
            }

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
                    .build();

            tosspaymentRepository.save(tossPayments);

            // ── [3단계] 매핑 테이블 데이터 적재와 상태 변경 처리 ──
            for (String orderNo : actualOrderNos) {
                // 💡 [참고]: 만약 매퍼/레포지토리의 하위 메서드가 반드시 숫자형 PK(Long)를 파라미터로 요구한다면
                // 아래 주석처럼 변환 과정을 거치거나, orderNo 기반 쿼리로 레포지토리를 매핑하세요.
                // Long numericOrderId = Long.parseLong(orderNo);

                // 여기서는 문자열 주문번호 혹은 형변환된 ID를 유연하게 매핑하도록 순회 타입을 String으로 일치시켰습니다.
                tosspaymentRepository.forceInsertPaymentOrder(tossPayments.getTossPaymentId(), orderNo);
                tosspaymentRepository.forceUpdateOrderStatus(orderNo, OrderStatus.CONFIRMED);
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
        return new PaymentResponse(tossPayments.getTossPaymentId(), tossPayments.getTossOrderId(), "CANCELED");
    }
}