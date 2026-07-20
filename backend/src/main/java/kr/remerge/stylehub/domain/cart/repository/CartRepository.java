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

    Optional<CartItem> findByUserAndProductOptionAndCartType(User user, ProductOption productOption, CartType cartType);

    @EntityGraph(attributePaths = {
            "productOption",
            "productOption.product",
            "productOption.product.company",
            "productOption.optionValues"
    })
    List<CartItem> findByUser_UserId(Integer userId);

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

    Optional<CartItem> findByCartItemIdAndUser_UserId(Integer cartItemId, Integer userId);
}
