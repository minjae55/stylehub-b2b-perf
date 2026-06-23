package kr.remerge.stylehub.domain.order.checkout;

import jakarta.validation.Valid;
import kr.remerge.stylehub.domain.order.checkout.dto.AddressCreateRequest;
import kr.remerge.stylehub.domain.order.checkout.dto.AddressResponse;
import kr.remerge.stylehub.domain.order.checkout.dto.CheckoutRequest;
import kr.remerge.stylehub.domain.order.checkout.dto.CheckoutResponse;
import kr.remerge.stylehub.domain.order.checkout.service.CheckoutService;
import kr.remerge.stylehub.global.auth.dto.AuthUser;
import kr.remerge.stylehub.global.auth.security.LoginUser;
import kr.remerge.stylehub.global.response.ApiResponse;
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
    public ResponseEntity<ApiResponse<CheckoutResponse>> checkout(
            @LoginUser AuthUser authUser,
            @Valid @RequestBody CheckoutRequest checkoutRequest
    ) {

        CheckoutResponse checkoutResponse =
                checkoutService.getCheckout(authUser.userId(), checkoutRequest);

        return ResponseEntity.ok(ApiResponse.success(checkoutResponse));
    }

    @GetMapping("/address")
    public ResponseEntity<ApiResponse<List<AddressResponse>>> address(
            @LoginUser AuthUser authUser
    ) {
        List<AddressResponse> userAddress =
                checkoutService.getAddress(authUser.userId());

        return ResponseEntity.ok(ApiResponse.success(userAddress));
    }

    @PostMapping("/address")
    public ResponseEntity<ApiResponse<AddressResponse>> createAddress(
            @LoginUser AuthUser authUser,
            @Valid @RequestBody AddressCreateRequest request
    ) {

        AddressResponse addressResponse =
                checkoutService.createAddress(authUser.userId(), request);

        return ResponseEntity.ok(ApiResponse.success(addressResponse));
    }
}
