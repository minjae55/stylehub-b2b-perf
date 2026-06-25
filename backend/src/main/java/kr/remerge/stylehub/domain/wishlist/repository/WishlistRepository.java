package kr.remerge.stylehub.domain.wishlist.repository;

import kr.remerge.stylehub.domain.wishlist.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<Wishlist, Integer> {

    List<Wishlist> findByUser_UserId(Integer userId);

    List<Wishlist> findByWishlistFolder_WishlistFolderId(Integer folderId);

    Optional<Wishlist> findByWishlistFolder_WishlistFolderIdAndProduct_ProductId(Integer folderId, Integer productId);

    boolean existsByUser_UserIdAndProduct_ProductId(Integer userId, Integer productId);

    void deleteByWishlistFolder_WishlistFolderIdAndProduct_ProductId(Integer folderId, Integer productId);
}