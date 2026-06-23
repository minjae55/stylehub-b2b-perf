package kr.remerge.stylehub.domain.cart;

import jakarta.validation.Valid;
import kr.remerge.stylehub.domain.cart.dto.CartAddRequest;
import kr.remerge.stylehub.domain.cart.dto.CartQuantityUpdateRequest;
import kr.remerge.stylehub.domain.cart.dto.CartResponse;
import kr.remerge.stylehub.domain.cart.service.CartService;
import kr.remerge.stylehub.global.auth.dto.AuthUser;
import kr.remerge.stylehub.global.auth.security.LoginUser;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> addItem(
            @LoginUser AuthUser authUser,
            @Valid @RequestBody CartAddRequest request
    ) {

        cartService.addToCart(authUser.userId(), request);
        return ResponseEntity.ok(ApiResponse.success());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CartResponse>>> getCart(
            @LoginUser AuthUser authUser
    ) {

        List<CartResponse> cartItemList = cartService.getCartByUserId(authUser.userId());

        return ResponseEntity.ok(ApiResponse.success(cartItemList));
    }

    @PatchMapping("/{cartItemId}/quantity")
    public ResponseEntity<ApiResponse<CartResponse>> updateQuantity(
            @PathVariable Integer cartItemId,
            @Valid @RequestBody CartQuantityUpdateRequest request,
            @LoginUser AuthUser authUser
    ) {

        CartResponse response =
                cartService.updateQuantity(authUser.userId(), cartItemId, request.quantity());

        return ResponseEntity.ok(ApiResponse.success(response));

    }

    @DeleteMapping("/{cartItemId}")
    public ResponseEntity<ApiResponse<Void>> deleteCartItem(
            @PathVariable Integer cartItemId,
            @LoginUser AuthUser authUser
    ) {

        cartService.deleteCartItem(authUser.userId(), cartItemId);

        return ResponseEntity.ok(ApiResponse.success());
    }


}
