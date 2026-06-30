package kr.remerge.stylehub.domain.company;

import kr.remerge.stylehub.domain.company.dto.request.CompanyVerifyRequest;
import kr.remerge.stylehub.domain.company.dto.response.OcrParseResponse;
import kr.remerge.stylehub.domain.company.repository.BrandRepository;
import kr.remerge.stylehub.global.response.ApiResponse; // 💡 공통 응답 임포트
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/company")
@RequiredArgsConstructor
@Slf4j
public class CompanyController {

    private final CompanyService companyService;
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

    /**
     * 흐름 1: 사업자등록증 이미지 업로드 → OCR 글자 파싱 후 결과 리턴
     */
    @PostMapping("/ocr")
    public ResponseEntity<ApiResponse<OcrParseResponse>> parseOcr(@RequestPart("file") MultipartFile file) {
        OcrParseResponse response = companyService.uploadAndParseOcr(file);
        // ApiResponse.success() 봉투에 담아서 리턴합니다.
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 흐름 3: 필수 4종 세트 최종 입력 후 → 국세청 진위확인 및 상태 검증
     */
    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<Void>> verifyBusiness(
            @RequestBody CompanyVerifyRequest request
    ) {

        log.info("[Front-end Input] businessNumber: '{}', companyName: '{}', representativeName: '{}', openDate: '{}'",
                request.businessNumber(),
                request.companyName(),
                request.representativeName(),
                request.openDate());

        // 내부에서 검증 실패 시 예외를 던지도록 설계하는 것이 GlobalExceptionHandler를 쓰는 정석입니다.
        // 만약 단순 boolean을 리턴한다면 아래처럼 분기하거나, 서비스단에서 throw new BusinessException()을 던지게 하세요.
        boolean isValid = companyService.verifyAndFilterBusiness(
                request.businessNumber(),
                request.companyName(),
                request.representativeName(),
                request.openDate()
        );

        // 성공 시 데이터 없이 { "success": true, "data": null } 형태로 리턴
        return ResponseEntity.ok(ApiResponse.success());
    }
}