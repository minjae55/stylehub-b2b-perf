package kr.remerge.stylehub.domain.order.checkout;

import jakarta.validation.Valid;
import kr.remerge.stylehub.domain.order.checkout.dto.CheckoutRequest;
import kr.remerge.stylehub.domain.order.checkout.dto.CheckoutResponse;
import kr.remerge.stylehub.domain.order.checkout.service.CheckoutService;
import kr.remerge.stylehub.global.auth.dto.AuthUser;
import kr.remerge.stylehub.global.auth.security.LoginUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/checkout")
@RequiredArgsConstructor
public class CheckoutController {

    private final CheckoutService checkoutService;

    @PostMapping("/preview")
    public ResponseEntity<CheckoutResponse> checkout(
            @LoginUser AuthUser authUser,
            @Valid @RequestBody CheckoutRequest checkoutRequest
            ) {

        CheckoutResponse checkoutResponse =
                checkoutService.getCheckout(authUser.userId(), checkoutRequest);

        return ResponseEntity.ok(checkoutResponse);
    }

}
