package kr.remerge.stylehub.domain.wishlist.repository;

import kr.remerge.stylehub.domain.wishlist.entity.WishlistFolder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WishlistFolderRepository extends JpaRepository<WishlistFolder, Integer> {

    List<WishlistFolder> findByUser_UserIdOrderBySortOrder(Integer userId);

    Optional<WishlistFolder> findByUser_UserIdAndIsDefaultTrue(Integer userId);

    boolean existsByUser_UserIdAndFolderName(Integer userId, String folderName);
}