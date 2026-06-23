package kr.remerge.stylehub.domain.cart.repository;

import kr.remerge.stylehub.domain.cart.entity.CartItem;
import kr.remerge.stylehub.domain.cart.enumtype.CartType;
import kr.remerge.stylehub.domain.product.entity.ProductOption;
import kr.remerge.stylehub.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;
import java.util.Optional;

public interface CartRepository extends JpaRepository<CartItem, Integer> {

    // 장바구니에서 아이템이 중복되는지 확인(유저, 동일 제품의 옵션, 카트 종류)
    Optional<CartItem> findByUserAndProductOptionAndCartType(User user, ProductOption productOption, CartType cartType);

    //유저의 장바구니 조회
    @EntityGraph(attributePaths = {
            "productOption",
            "productOption.product",
            "productOption.product.company",
            "productOption.optionValues"
    })
    List<CartItem> findByUser_UserId(Integer userId);

    //유저의 카트 타입과 어떤 아이템들이 있는지 조회
    @EntityGraph(attributePaths = {
            "productOption",
            "productOption.product",
            "productOption.product.company",
            "productOption.optionValues"
    })
    List<CartItem> findByCartItemIdInAndUser_UserIdAndCartType(
            List<Integer> cartItemIds,
            Integer userId,
            CartType cartType
    );

    //유저의 장바구니 중 한 개의 아이템 조회
    Optional<CartItem> findByCartItemIdAndUser_UserId(Integer cartItemId, Integer userId);
}
