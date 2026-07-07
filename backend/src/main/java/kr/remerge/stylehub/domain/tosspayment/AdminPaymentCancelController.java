package kr.remerge.stylehub.domain.tosspayment;

import kr.remerge.stylehub.domain.tosspayment.dto.TossPaymentDto;
import kr.remerge.stylehub.domain.banktransfer.service.BankTransferCancelService;
import kr.remerge.stylehub.domain.tosspayment.service.PaymentCancelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/payments")
@RequiredArgsConstructor
public class AdminPaymentCancelController {

    private final PaymentCancelService paymentCancelService;
    private final BankTransferCancelService bankTransferCancelService;

    // 카드결제 취소 - paymentKey(String)가 PK이므로 String 경로변수 사용
    @PostMapping("/card/{paymentKey}/cancel")
    public ResponseEntity<TossPaymentDto.CancelResult> cancelCardPayment(
            @PathVariable String paymentKey,
            @RequestBody PaymentCancelRequest request
    ) {
        TossPaymentDto.CancelResult result =
                paymentCancelService.cancelCardPayment(paymentKey, request.cancelReason());
        return ResponseEntity.ok(result);
    }

    // 무통장입금 취소 - PK가 Long이므로 별도 엔드포인트로 분리
    @PostMapping("/bank-transfer/{bankTransferPaymentId}/cancel")
    public ResponseEntity<Void> cancelBankTransfer(
            @PathVariable Long bankTransferPaymentId,
            @RequestBody PaymentCancelRequest request
    ) {
        bankTransferCancelService.cancelBankTransfer(bankTransferPaymentId, request.cancelReason());
        return ResponseEntity.ok().build();
    }
}