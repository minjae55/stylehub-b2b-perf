package kr.remerge.stylehub.domain.tosspayment;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class TossPaymentController {

    private final TossPaymentService tossPaymentService;

    @PostMapping("/confirm")
    public ResponseEntity<PaymentResponse> confirmPayment(@RequestBody PaymentConfirmRequest dto) {

        log.info("============== [결제 요청 들어옴] ==============");
        log.info("대표 tossOrderId: {}", dto.orderId());
        log.info("금액 amount: {}", dto.amount());
        log.info("하위 개별 주문 리스트 orderIds: {}", dto.orderIds()); // 💡 여기에 뭐가 찍히는지 콘솔에서 필히 확인해야 합니다!

        PaymentResponse response;

        // 💡 개수 조건(>1)을 빼고, 리스트가 존재하고 비어있지 않다면 무조건 그룹 결제로 넘깁니다.
        if (dto.orderIds() != null && !dto.orderIds().isEmpty()) {
            log.info("▶ [분기 완료] 하위 orderIds가 발견되어 '그룹 결제'로 처리합니다. (개수: {}개)", dto.orderIds().size());
            response = tossPaymentService.confirmGroupPayment(dto);
        } else {
            log.info("▶ [분기 완료] 하위 orderIds가 없거나 비어있어 '단건 결제'로 처리합니다.");
            response = tossPaymentService.confirmPayment(dto);
        }

        return ResponseEntity.ok(response);
    }
}