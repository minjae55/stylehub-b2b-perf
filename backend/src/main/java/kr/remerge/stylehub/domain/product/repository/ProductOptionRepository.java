package kr.remerge.stylehub.domain.product.repository;

import kr.remerge.stylehub.domain.product.entity.ProductOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductOptionRepository extends JpaRepository<ProductOption, Integer> {

    @Modifying
    @Query("UPDATE ProductOption po SET po.stockQuantity = po.stockQuantity - :quantity " +
            "WHERE po.productOptionId = :id AND po.stockQuantity >= :quantity")
    int decreaseStock(@Param("id") Integer productOptionId, @Param("quantity") Integer quantity);
}
