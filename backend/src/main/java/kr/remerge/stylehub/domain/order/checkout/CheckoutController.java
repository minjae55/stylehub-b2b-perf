package kr.remerge.stylehub.domain.order.checkout;

import jakarta.validation.Valid;
import kr.remerge.stylehub.domain.order.checkout.dto.AddressCreateRequest;
import kr.remerge.stylehub.domain.order.checkout.dto.AddressResponse;
import kr.remerge.stylehub.domain.order.checkout.dto.CheckoutRequest;
import kr.remerge.stylehub.domain.order.checkout.dto.CheckoutResponse;
import kr.remerge.stylehub.domain.order.checkout.service.CheckoutService;
import kr.remerge.stylehub.global.auth.dto.AuthUser;
import kr.remerge.stylehub.global.auth.security.LoginUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/address")
    public ResponseEntity<List<AddressResponse>> address(
            @LoginUser AuthUser authUser
    ) {
        List<AddressResponse> userAddress =
                checkoutService.getAddress(authUser.userId());

        return ResponseEntity.ok(userAddress);
    }

    @PostMapping("/address")
    public ResponseEntity<?> createAddress(
            @LoginUser AuthUser authUser,
            @Valid @RequestBody AddressCreateRequest request
    ) {

        AddressResponse addressResponse =
                checkoutService.createAddress(authUser.userId(), request);

        return ResponseEntity.ok(addressResponse);
    }
}
