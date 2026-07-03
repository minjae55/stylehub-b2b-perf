package kr.remerge.stylehub.domain.tosspayment;

import jakarta.validation.Valid;
import kr.remerge.stylehub.global.auth.dto.login.AuthUser;
import kr.remerge.stylehub.global.auth.security.LoginUser;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class TossPaymentController {

    private final TossPaymentService tossPaymentService;

    @PostMapping("/confirm")
    public ResponseEntity<ApiResponse<PaymentResponse>> confirmPayment(
            @LoginUser AuthUser authUser,
            @Valid @RequestBody PaymentConfirmRequest request
    ) {
        PaymentResponse response = tossPaymentService.confirmPayment(
                authUser.userId(),
                request
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
