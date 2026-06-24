package kr.remerge.stylehub.domain.product.repository;

import kr.remerge.stylehub.domain.product.entity.ProductCertification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductCertificationRepository extends JpaRepository<ProductCertification, Integer> {}