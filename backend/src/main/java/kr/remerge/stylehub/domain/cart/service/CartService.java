package kr.remerge.stylehub.domain.cart.service;

import kr.remerge.stylehub.domain.cart.dto.CartAddRequest;
import kr.remerge.stylehub.domain.cart.dto.CartResponse;
import kr.remerge.stylehub.domain.cart.entity.CartItem;
import kr.remerge.stylehub.domain.cart.enumtype.CartType;
import kr.remerge.stylehub.domain.cart.repository.CartRepository;
import kr.remerge.stylehub.domain.product.entity.ProductOption;
import kr.remerge.stylehub.domain.product.repository.ProductOptionRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final ProductOptionRepository productOptionRepository;

    @Transactional
    public void addToCart(Integer userId, CartAddRequest request) {
        User user = findUser(userId);
        ProductOption productOption = findProductOption(request);

        validateSampleOption(productOption, request);

        cartRepository.findByUserAndProductOptionAndCartType(
                user,
                productOption,
                request.cartType()
        ).ifPresentOrElse(
                cartItem -> cartItem.addQuantity(request.quantity()),
                () -> cartRepository.save(
                        new CartItem(
                                user,
                                productOption,
                                request.quantity(),
                                request.cartType()
                        )
                )
        );
    }

    private void validateSampleOption(ProductOption option, CartAddRequest request) {

        if (request.cartType() != CartType.SAMPLE) {
            return;
        }

        if (!option.getProduct().getSampleAvailable()
                || option.getSamplePrice() == null
                || option.getSampleMaxQuantity() == null
        ) {
            throw new BusinessException(
                    ErrorCode.SAMPLE_OPTION_NOT_CONFIGURED
            );
        }

        if (request.quantity() > option.getSampleMaxQuantity()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

    }

    public List<CartResponse> getCartByUserId(Integer userId) {

        validateUserId(userId);

        return cartRepository.findByUser_UserId(userId)
                .stream()
                .map(CartResponse::from)
                .toList();
    }

    @Transactional
    public CartResponse updateQuantity(Integer userId, Integer cartItemId, Integer quantity) {
        CartItem cartItem = getOwnedCartItem(userId, cartItemId);
        cartItem.updateQuantity(quantity);
        return CartResponse.from(cartItem);
    }

    @Transactional
    public void deleteCartItem(Integer userId, Integer cartItemId) {
        CartItem cartItem = getOwnedCartItem(userId, cartItemId);
        cartRepository.delete(cartItem);
    }

    private ProductOption findProductOption(CartAddRequest request) {
        return productOptionRepository.findById(request.productOptionId())
                .orElseThrow(() -> new IllegalArgumentException("상품을 조회할 수 없습니다."));
    }

    private User findUser(Integer userId) {
        validateUserId(userId);

        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("회원 정보를 찾을 수 없습니다."));
    }

    private CartItem getOwnedCartItem(Integer userId, Integer cartItemId) {
        validateUserId(userId);

        return cartRepository.findByCartItemIdAndUser_UserId(cartItemId, userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("장바구니 상품을 조회할 수 없습니다.")
                );
    }

    private void validateUserId(Integer userId) {
        if (userId == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }
    }
}
