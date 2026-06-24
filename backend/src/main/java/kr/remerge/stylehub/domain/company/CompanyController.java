package kr.remerge.stylehub.domain.company;

import kr.remerge.stylehub.domain.company.repository.BrandRepository;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/company")
@RequiredArgsConstructor
public class CompanyController {

    private final BrandRepository brandRepository;

    @GetMapping("/brands")
    public ResponseEntity<ApiResponse<List<BrandDto>>> getMyBrands() {
        List<BrandDto> list = brandRepository.findAll()
                .stream()
                .map(b -> new BrandDto(b.getBrandId(), b.getBrandName()))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    public record BrandDto(Integer brandId, String brandName) {}
}