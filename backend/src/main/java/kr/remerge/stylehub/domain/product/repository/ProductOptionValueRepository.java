package kr.remerge.stylehub.domain.product.repository;

import kr.remerge.stylehub.domain.product.entity.ProductOptionValue;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductOptionValueRepository extends JpaRepository<ProductOptionValue, Integer> {
}