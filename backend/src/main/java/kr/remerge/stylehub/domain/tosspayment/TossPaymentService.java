package kr.remerge.stylehub.domain.tosspayment;

import jakarta.transaction.Transactional;
import kr.remerge.stylehub.domain.tosspayment.entity.TossPayments;
import kr.remerge.stylehub.domain.tosspayment.enumtype.PaymentStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TossPaymentService {
    private final TossPaymentRepository tosspaymentRepository;
    private final TossPaymentsClient tossPaymentsClient;

    @Transactional
    public PaymentResponse confirmPayment(PaymentConfirmRequest dto) {
        // 1. [보안 핵심] 결제 요청 전 DB 주문 정보 조회 및 검증
        TossPayments order = tosspaymentRepository.findById(dto.orderId())
                .orElseThrow(() -> new IllegalArgumentException("주문 정보를 찾을 수 없습니다."));

        // 가공된 주문 금액과 프론트엔드 결제 요청 금액이 일치하는지 비교 (예시 메서드: order.getAmount())
        if (!order.getAmount().equals(dto.amount())) {
            throw new IllegalArgumentException("결제 요청 금액이 실제 주문 금액과 일치하지 않습니다. 위변조 위험이 있습니다.");
        }

        // 2. 토스 페이먼츠 승인 API 호출
        PaymentResult tossResult = tossPaymentsClient.confirm(dto);

        // 3. 결제 정보 DB 저장
        TossPayments tossPayments = TossPayments.builder()
                .tossPaymentKey(dto.paymentKey())
                .tossOrderId(dto.orderId())
                .status("Done")
                .amount(dto.amount())
                .method(tossResult.method())
                .approvedAt(java.time.OffsetDateTime.parse(tossResult.approvedAt()).toLocalDateTime()) // 시간 파싱 추가
                .build();

        tosspaymentRepository.save(tossPayments);

        // 4. 주문 상태 업데이트 (주문 엔티티 내부 메서드 호출)
//        order.markAsPaid();

        return new PaymentResponse(tossPayments.getTossPaymentKey(), order.getTossOrderId(), "DONE");
    }

    @Transactional
    public PaymentResponse cancelPayment(String paymentKey, PaymentCancelRequest request) {
        // 1. DB 결제 정보 찾기
        TossPayments tossPayments = tosspaymentRepository.findById(paymentKey)
                .orElseThrow(() -> new IllegalArgumentException("결제 정보를 찾을 수 없습니다."));

//        if (tossPayments.getStatus() == PaymentStatus.CANCELED) {
//            throw new IllegalStateException("이미 취소된 결제입니다.");
//        }

        // 2. 토스 API 호출
        tossPaymentsClient.cancel(paymentKey, request);

        // 3. 결제 엔티티 상태 업데이트 (엔티티 내부에 updateStatus 혹은 cancel 메서드 구현 필요)
        tossPayments.updateStatus(PaymentStatus.CANCELED);

        // 4. 주문 정보 조회 후 상태 변경
        TossPayments order = tosspaymentRepository.findById(tossPayments.getTossPaymentKey())
                .orElseThrow(() -> new IllegalArgumentException("연관된 주문 정보를 찾을 수 없습니다."));
//        order.cancelOrder();

        return new PaymentResponse(tossPayments.getTossPaymentKey(), order.getTossOrderId(), "CANCELED");
    }
}