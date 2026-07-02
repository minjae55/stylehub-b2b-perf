package kr.remerge.stylehub.domain.category.repository;

import kr.remerge.stylehub.domain.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Integer> {
    // 활성화된 대분류(depth=1) 카테고리를 정렬 순서대로 조회
    List<Category> findByDepthAndIsActiveTrueOrderBySortOrderAsc(Integer depth);
    // 최상위(부모) 카테고리만 조회 - 자동배정 기준 및 소싱 요청 카테고리 선택에 사용
    List<Category> findByParentIsNullAndIsActiveTrueOrderBySortOrderAsc();
}