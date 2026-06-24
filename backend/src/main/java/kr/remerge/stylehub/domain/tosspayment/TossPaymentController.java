package kr.remerge.stylehub.domain.tosspayment;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor // 💡 서비스 레이어 주입을 위한 어노테이션
public class TossPaymentController {

    // 비즈니스 로직이 구현되어 있는 서비스 컴포넌트 주입
    private final TossPaymentService tossPaymentService;

    @PostMapping("/confirm")
    public ResponseEntity<PaymentResponse> confirmPayment(@RequestBody PaymentConfirmRequest dto) {

        log.info("=== 프론트엔드로부터 결제 승인 요청 도달 ===");
        log.info("orderId: {}, paymentKey: {}, amount: {}", dto.orderId(), dto.paymentKey(), dto.amount());

        // 💡 [수정] 서비스 레이어를 호출하여 실제 토스 API와 통신하고 결과를 받아옵니다.
        PaymentResponse response = tossPaymentService.confirmPayment(dto);

        // 💡 [수정] 최종 결과를 프론트엔드에게 return문으로 반환합니다.
        return ResponseEntity.ok(response);
    }
}