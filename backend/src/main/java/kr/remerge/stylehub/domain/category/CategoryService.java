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
}