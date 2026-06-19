package kr.remerge.stylehub.domain.category;

import kr.remerge.stylehub.domain.category.dto.response.CategoryResponse;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping("/main")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getMainCategories() {
        List<CategoryResponse> responses = categoryService.getMainCategories();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}