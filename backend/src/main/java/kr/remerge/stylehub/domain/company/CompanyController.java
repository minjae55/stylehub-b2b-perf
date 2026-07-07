package kr.remerge.stylehub.domain.company;

import jakarta.validation.Valid;
import kr.remerge.stylehub.domain.company.dto.request.CompanyVerifyRequest;
import kr.remerge.stylehub.domain.company.dto.request.UpdateCompanyRequest;
import kr.remerge.stylehub.domain.company.dto.request.UpdateMemberRoleRequest;
import kr.remerge.stylehub.domain.company.dto.request.UpdateMemberStatusRequest;
import kr.remerge.stylehub.domain.company.dto.response.*;
import kr.remerge.stylehub.domain.company.repository.BrandRepository;
import kr.remerge.stylehub.domain.user.UserService;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;
import kr.remerge.stylehub.global.auth.dto.login.AuthUser;
import kr.remerge.stylehub.global.auth.security.LoginUser;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/company")
@RequiredArgsConstructor
@Slf4j
public class CompanyController {

    private final CompanyService companyService;
    private final BrandRepository brandRepository;
    private final UserService userService;

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
     * 흐름 2: 필수 4종 세트 최종 입력 후 → 국세청 진위확인 및 상태 검증
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

    /**
     * 흐름 3: 직원 가입 단계 — 사업자번호로 소속 회사 조회 및 역할군 자격 검증
     * URL 예시: /api/company/lookup?businessNumber=1234567890&businessRole=SELLER
     */
    @GetMapping("/lookup")
    public ResponseEntity<ApiResponse<CompanyLookupResponse>> lookupCompany(
            @RequestParam("businessNumber") String businessNumber,
            @RequestParam("businessRole") String businessRole
    ) {
        log.info("[Company Lookup Request] businessNumber: {}, businessRole: {}", businessNumber, businessRole);

        CompanyLookupResponse response = companyService.lookupAndValidateCompany(businessNumber, businessRole);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 소속 회사 상세 정보 조회
     */
    @GetMapping("/{companyId}")
    public ResponseEntity<ApiResponse<CompanyDetailResponse>> getCompanyDetail(
            @PathVariable Integer companyId,
            @LoginUser AuthUser authUser
    ) {
        log.info("[Company Detail Request] userId: {}, companyId: {}", authUser.userId(), companyId);

        CompanyDetailResponse response = companyService.getCompanyDetail(companyId, authUser);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 회사 정보 변경
     */
    @PatchMapping("/{companyId}")
    public ResponseEntity<ApiResponse<Void>> updateCompanyDetail(
            @PathVariable Integer companyId,
            @Valid @RequestBody UpdateCompanyRequest request,
            @LoginUser AuthUser authUser
    ) {
        log.info("[Company Update Request] userId: {}, companyId: {}, newCompanyName: {}",
                authUser.userId(), companyId, request.companyName());

        companyService.updateCompanyDetail(companyId, request, authUser);
        return ResponseEntity.ok(ApiResponse.success());
    }

    /**
     * 문의용: ADMIN 화면의 회사 필터용 — 전체 회사 목록 조회
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CompanyResponse>>> getCompanies(
            @LoginUser AuthUser authUser
    ) {
        List<CompanyResponse> response = companyService.getAllCompanies(authUser);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 문의용: PRESIDENT 화면의 직원 필터용 — 본인 회사 소속 직원 목록 조회
     */
    @GetMapping("/{companyId}/inquiry-employees")
    public ResponseEntity<ApiResponse<List<EmployeeResponse>>> getInquiryEmployees(
            @PathVariable Integer companyId,
            @LoginUser AuthUser authUser
    ) {
        List<EmployeeResponse> response = companyService.getInquiryByCompanyId(companyId, authUser);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 직원관리용: PRESIDENT 화면의 직원 필터용 — 본인 회사 소속 직원 목록 조회
     */
    @GetMapping("/{companyId}/employees")
    public ResponseEntity<ApiResponse<List<EmployeeResponse>>> getCompanyEmployees(
            @PathVariable Integer companyId,
            @LoginUser AuthUser authUser
    ) {
        if (!Objects.equals(authUser.role(), UserRole.PRESIDENT.name())
                && !Objects.equals(authUser.role(), UserRole.ADMIN.name())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        List<EmployeeResponse> response = companyService.getEmployeesByCompanyId(companyId, authUser);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 직원 권한/역할 변경 API
     * PATCH /company/members/{userId}/role
     */
    @PatchMapping("/{userId}/role")
    public ResponseEntity<ApiResponse<Void>> updateMemberRole(
            @PathVariable Integer userId,
            @RequestBody UpdateMemberRoleRequest request,
            @LoginUser AuthUser authUser
    ) {
        userService.updateMemberRole(userId, request, authUser);
        return ResponseEntity.ok(ApiResponse.success());
    }

    /**
     * 직원 관리용: PRESIDENT 또는 ADMIN 화면에서 직원의 계정 상태(UserStatus)를 변경
     * PATCH /api/company/{userId}/status
     */
    @PatchMapping("/{userId}/status")
    public ResponseEntity<ApiResponse<Void>> updateMemberStatus(
            @PathVariable Integer userId,
            @RequestBody UpdateMemberStatusRequest request,
            @LoginUser AuthUser authUser
    ) {
        // 권한 검증: 대표(PRESIDENT)이거나 관리자(ADMIN)만 타인의 상태를 변경 가능
        if (!"PRESIDENT".equals(authUser.role()) && !"ADMIN".equals(authUser.role())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        // userService를 호출하여 상태를 변경합니다.
        userService.updateUserStatus(userId, request.status(), authUser);
        return ResponseEntity.ok(ApiResponse.success());
    }
}