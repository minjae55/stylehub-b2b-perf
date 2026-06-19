package kr.remerge.stylehub.domain.cart;

import jakarta.validation.Valid;
import kr.remerge.stylehub.domain.cart.dto.CartAddRequest;
import kr.remerge.stylehub.domain.cart.dto.CartQuantityUpdateRequest;
import kr.remerge.stylehub.domain.cart.dto.CartResponse;
import kr.remerge.stylehub.domain.cart.service.CartService;
import kr.remerge.stylehub.global.auth.security.AuthUser;
import kr.remerge.stylehub.global.auth.security.LoginUser;
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
    public ResponseEntity<?> addItem(
            @LoginUser AuthUser authUser,
            @Valid @RequestBody CartAddRequest request
    ) {

        cartService.addToCart(authUser.userId(), request);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<CartResponse>> getCart(
            @LoginUser AuthUser authUser
    ) {

        List<CartResponse> cartItemList = cartService.getCartByUserId(authUser.userId());

        return ResponseEntity.ok(cartItemList);
    }

    @PatchMapping("/{cartItemId}/quantity")
    public ResponseEntity<CartResponse> updateQuantity(
            @PathVariable Integer cartItemId,
            @Valid @RequestBody CartQuantityUpdateRequest request,
            @LoginUser AuthUser authUser
    ) {

        CartResponse response =
                cartService.updateQuantity(authUser.userId(), cartItemId, request.quantity());

        return ResponseEntity.ok(response);

    }

    @DeleteMapping("/{cartItemId}")
    public ResponseEntity<Void> deleteCartItem(
            @PathVariable Integer cartItemId,
            @LoginUser AuthUser authUser
    ) {

        cartService.deleteCartItem(authUser.userId(), cartItemId);

        return ResponseEntity.noContent().build();
    }


}
