package kr.remerge.stylehub.domain.product.repository;

import kr.remerge.stylehub.domain.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Integer> {

    // 셀러별 상품 목록
    List<Product> findBySeller_UserId(Integer sellerId);

    // 카테고리별 상품 목록
    List<Product> findByCategory_CategoryId(Integer categoryId);

    // 브랜드별 상품 목록
    List<Product> findByBrand_BrandId(Integer brandId);

    // 신규 상품 (최근 등록순 6개)
    List<Product> findTop6ByOrderByCreatedAtDesc();

    // 인기 상품 (7일 내 조회수 높은 순 5개)
    @Query("SELECT p FROM Product p WHERE p.createdAt >= :since ORDER BY p.viewCount DESC")
    List<Product> findTop5ByViewCountSince(@Param("since") LocalDateTime since, Pageable pageable);
}