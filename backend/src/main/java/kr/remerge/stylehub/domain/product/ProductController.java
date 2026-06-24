package kr.remerge.stylehub.domain.product;

import kr.remerge.stylehub.domain.product.dto.ProductDto;
import kr.remerge.stylehub.domain.product.service.ProductService;
import kr.remerge.stylehub.global.auth.security.CustomUserDetails;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    // [POST] 상품 등록
    @PostMapping
    public ResponseEntity<ApiResponse<ProductDto.DetailResponse>> create(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody ProductDto.CreateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(productService.create(userDetails, request)));
    }

    // [GET] 전체 상품 목록
    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductDto.SummaryResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(productService.getAll()));
    }

    // [GET] 신규 상품 (최근 등록순 6개)
    @GetMapping("/new")
    public ResponseEntity<ApiResponse<List<ProductDto.SummaryResponse>>> getNewProducts() {
        return ResponseEntity.ok(ApiResponse.success(productService.getNewProducts()));
    }

    // [GET] 인기 상품 (7일 내 조회수 높은 순 5개)
    @GetMapping("/popular")
    public ResponseEntity<ApiResponse<List<ProductDto.SummaryResponse>>> getPopularProducts() {
        return ResponseEntity.ok(ApiResponse.success(productService.getPopularProducts()));
    }

    // [GET] 상품 단건 조회
    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductDto.DetailResponse>> getById(
            @PathVariable Integer productId
    ) {
        return ResponseEntity.ok(ApiResponse.success(productService.getById(productId)));
    }

    // [GET] 내 상품 목록 (셀러용)
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<ProductDto.SummaryResponse>>> getMy(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(productService.getMy(userDetails)));
    }

    // [PATCH] 상품 수정
    @PatchMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductDto.DetailResponse>> update(
            @PathVariable Integer productId,
            @RequestBody ProductDto.UpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(productService.update(productId, request)));
    }

    // [DELETE] 상품 삭제
    @DeleteMapping("/{productId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Integer productId
    ) {
        productService.delete(productId);
        return ResponseEntity.ok(ApiResponse.success());
    }
}
