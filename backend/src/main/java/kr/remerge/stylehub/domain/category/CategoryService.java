package kr.remerge.stylehub.domain.category;

import kr.remerge.stylehub.domain.category.dto.response.CategoryResponse;
import kr.remerge.stylehub.domain.category.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<CategoryResponse> getMainCategories() {
        // 대분류(depth = 1) 조회 후 DTO 스펙으로 치환
        return categoryRepository.findByDepthAndIsActiveTrueOrderBySortOrderAsc(1).stream()
                .map(CategoryResponse::from)
                .collect(Collectors.toList());
    }

    // 부모 카테고리만 조회. company_handled_categories(자동배정 기준)와 소싱 요청서 카테고리 선택 둘 다
    // 최상위 카테고리 단위로만 관리하기로 했으므로 여기서 depth/parent 필터링을 전담한다.
    @Transactional(readOnly = true)
    public List<CategoryResponse> getParentCategories() {
        return categoryRepository.findByParentIsNullAndIsActiveTrueOrderBySortOrderAsc()
                .stream()
                .map(CategoryResponse::from)
                .toList();
    }
}