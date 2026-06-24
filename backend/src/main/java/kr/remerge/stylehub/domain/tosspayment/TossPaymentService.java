package kr.remerge.stylehub.domain.tosspayment;

import jakarta.transaction.Transactional;
import kr.remerge.stylehub.domain.order.OrderRepository;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.tosspayment.entity.TossPayments;
import kr.remerge.stylehub.domain.tosspayment.enumtype.PaymentStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.OffsetDateTime;
import java.time.LocalDateTime;

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
    public PaymentResponse cancelPayment(String paymentKey, PaymentCancelRequest request) {
        TossPayments tossPayments = tosspaymentRepository.findById(paymentKey)
                .orElseThrow(() -> new IllegalArgumentException("결제 정보를 찾을 수 없습니다."));

        tossPaymentsClient.cancel(paymentKey, request);
//        tossPayments.updateStatus(PaymentStatus.CANCELED);

        return new PaymentResponse(tossPayments.getTossPaymentId(), tossPayments.getTossOrderId(), "CANCELED");
    }
}