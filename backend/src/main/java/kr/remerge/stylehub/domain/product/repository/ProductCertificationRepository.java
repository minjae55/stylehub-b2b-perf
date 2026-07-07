package kr.remerge.stylehub.domain.product.repository;

import kr.remerge.stylehub.domain.product.entity.ProductCertification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductCertificationRepository extends JpaRepository<ProductCertification, Integer> {

    // [추가] 특정 상품에 등록된 인증서 목록 조회
    List<ProductCertification> findByProduct_ProductId(Integer productId);
}