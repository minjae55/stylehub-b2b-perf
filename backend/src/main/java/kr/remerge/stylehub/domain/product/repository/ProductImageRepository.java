package kr.remerge.stylehub.domain.product.repository;

import kr.remerge.stylehub.domain.product.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductImageRepository extends JpaRepository<ProductImage, Integer> {
}