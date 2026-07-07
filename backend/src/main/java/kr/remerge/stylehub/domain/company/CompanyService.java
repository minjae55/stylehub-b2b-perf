package kr.remerge.stylehub.domain.company;

import kr.remerge.stylehub.domain.company.client.NtsApiClient;
import kr.remerge.stylehub.domain.company.client.OcrApiClient;
import kr.remerge.stylehub.domain.company.dto.request.UpdateCompanyRequest;
import kr.remerge.stylehub.domain.company.dto.response.*;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.company.repository.CompanyRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.enumtype.BusinessRole;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import kr.remerge.stylehub.global.auth.dto.login.AuthUser;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CompanyService {

    private final OcrApiClient ocrApiClient;
    private final NtsApiClient ntsApiClient;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    /**
     * 1. 프론트엔드에서 이미지를 받아서 OCR 분석 결과를 가공하여 반환
     */
    public OcrParseResponse uploadAndParseOcr(MultipartFile file) {
        try {
            System.out.println("=== [1] 네이버 OCR 호출 시작 ===");
            OcrResponse ocrResponse = ocrApiClient.callOcr(file);
            System.out.println("=== [2] 네이버 OCR 호출 성공 ===");

            if (ocrResponse.images() == null || ocrResponse.images().isEmpty()) {
                throw new BusinessException(ErrorCode.OCR_PARSING_FAILED);
            }

            // 4종 세트 자동 파싱 메서드 작동
            String businessNumber = ocrResponse.extractBusinessNumber();
            String companyName = ocrResponse.extractCompanyName();
            String representativeName = ocrResponse.extractRepresentativeName();
            String openDate = ocrResponse.extractOpenDate();

            return new OcrParseResponse(businessNumber, companyName, representativeName, openDate);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.FILE_UPLOAD_ERROR);
        }
    }

    /**
     * 2. 최종 정보 조회 버튼 클릭 시 국세청 진위확인 및 의류 업종 필터링을 수행
     */
    public boolean verifyAndFilterBusiness(String businessNumber, String companyName, String representativeName, String openDate) {
        // 하이픈 제거 전처리 추가 (국세청 전송용)
        String cleanNum = businessNumber.replace("-", "");
        String cleanDate = openDate.replace("-", "");

        // 2-1. 중복 가입 방지 (DB 확인)
        if (companyRepository.existsByBusinessNumber(cleanNum)) {
            throw new BusinessException(ErrorCode.DUPLICATE_BUSINESS_NUMBER);
        }

        // 2-2. 국세청 진위확인 API 호출 (4종 세트 전송)
        NtsResponse ntsResponse = ntsApiClient.validateBusiness(cleanNum, companyName, representativeName, cleanDate);

        log.info("[NTS Response] valid_code: {}, status_code: {}, response: {}",
                (ntsResponse.data() != null && !ntsResponse.data().isEmpty()) ? ntsResponse.data().get(0).valid() : "null",
                (ntsResponse.data() != null && !ntsResponse.data().isEmpty() && ntsResponse.data().get(0).status() != null) ? ntsResponse.data().get(0).status().bSttCd() : "null",
                ntsResponse
        );

        // 국세청 record 구조에 맞게 매핑 상태값 추출 ('01'이 유효)
        if (ntsResponse.data() == null || ntsResponse.data().isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_BUSINESS_INFORMATION);
        }

        NtsResponse.NtsValidationDetail detail = ntsResponse.data().get(0);
        if (!"01".equals(detail.valid())) {
            throw new BusinessException(ErrorCode.INVALID_BUSINESS_INFORMATION);
        }

        // 2-3. 의류 업종 제한 필터링
        // 국세청에서 정상 유효한 사업자('01')이며 동시에 '계속사업자('01')' 상태인지 세부 코드로 2차 방어 검증을 하거나,
        // 오류가 나지 않도록 비즈니스상 허용 키워드 로직을 정비해 줍니다.
        String businessStatusCd = detail.status() != null ? detail.status().bSttCd() : "";
        if (!"01".equals(businessStatusCd)) {
            throw new BusinessException(ErrorCode.NOT_CLOTHING_BUSINESS); // 활성화되지 않은 상태 차단
        }

        return true;
    }

    /**
     * 3. 직원 회원가입 전: 사업자번호로 소속 회사 존재 여부 및 가입 자격 검증
     */
    public CompanyLookupResponse lookupAndValidateCompany(String businessNumber, String businessRole) {
        // 하이픈 제거 전처리
        String cleanNum = businessNumber.replace("-", "");

        // DB에서 회사 조회 (없으면 회사를 찾을 수 없다는 에러 발생)
        Company company = companyRepository.findByBusinessNumber(cleanNum)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMPANY_NOT_FOUND));

        BusinessRole roleEnum;
        try {
            roleEnum = BusinessRole.valueOf(businessRole.toUpperCase().trim());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new BusinessException(ErrorCode.INVALID_JOIN_ROLE); // 잘못된 역할군 예외 처리
        }

        company.validateEmployeeJoinEligibility(roleEnum);

        // 검증 통과 시 프론트 UI 그리기에 필요한 정보만 리턴
        return new CompanyLookupResponse(
                company.getName(),
                company.getRepresentativeName(),
                company.getSellerStatus()
        );
    }

    /**
     * 소속 회사 상세 정보 조회
     */
    public CompanyDetailResponse getCompanyDetail(Integer companyId, AuthUser authUser) {
        // 보안 검증: 대표(PRESIDENT)나 직원 권한일 때 본인 소속 회사가 아니라면 차단 (ADMIN은 허용 가능)
        if (!"ADMIN".equals(authUser.role()) && !companyId.equals(authUser.companyId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMPANY_NOT_FOUND));

        return CompanyDetailResponse.from(company);
    }

    /**
     * 회사 정보 변경 및 셀러 권한 심사 신청
     */
    @Transactional
    public void updateCompanyDetail(Integer companyId, UpdateCompanyRequest request, AuthUser authUser) {
        // 보안 검증: 본인 회사 정보만 수정 가능하도록 제한
        if (!"ADMIN".equals(authUser.role()) && !companyId.equals(authUser.companyId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMPANY_NOT_FOUND));

        company.updateDetails(
                request.companyName(),
                request.businessNumber().replace("-", ""),
                request.representativeName(),
                request.representativePhone(),
                request.websiteUrl(),
                request.description(),
                request.address(),
                request.addressDetail(),
                request.logoUrl(),
                request.businessLicenseUrl()
        );
    }

    /**
     * 1. ADMIN용 — 전체 회사 목록 조회
     */
    public List<CompanyResponse> getAllCompanies(AuthUser authUser) {
        // 보안 검증: 요청한 유저가 ADMIN이 맞는지 한 번 더 체크
        if (!"ADMIN".equals(authUser.role())) {
            throw new BusinessException(ErrorCode.FORBIDDEN); // 권한 없음 에러 처리
        }

        return companyRepository.findAll().stream()
                .map(CompanyResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 2. PRESIDENT용 — 본인 회사 소속 직원 목록 조회
     */
    public List<EmployeeResponse> getInquiryByCompanyId(Integer companyId, AuthUser authUser) {
        // 보안 검증: 대표자(PRESIDENT)가 요청했을 때, 본인의 회사 ID와 주소창의 companyId가 일치하는지 확인
        // 만약 다르면 다른 회사 정보를 훔쳐보려는 시도이므로 차단합니다.
        if ("PRESIDENT".equals(authUser.role()) && !authUser.companyId().equals(companyId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        // 특정 회사 ID(`companyId`)에 속해 있으면서 권한이 일반 직원(EMPLOYEE)인 사람들을 조회
        // (프로젝트 엔티티 설계에 따라 쿼리 메서드명은 조금씩 다를 수 있습니다)
        List<User> employees = userRepository.findByCompany_CompanyIdAndRole(companyId, UserRole.EMPLOYEE);

        return employees.stream()
                .filter(user -> user.getRole() != UserRole.PRESIDENT)
                .map(EmployeeResponse::ofSimple)
                .collect(Collectors.toList());
    }

    public List<EmployeeResponse> getEmployeesByCompanyId(Integer companyId, AuthUser authUser) {
        // 보안 검증
        if ("PRESIDENT".equals(authUser.role()) && !authUser.companyId().equals(companyId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        // 대표 본인을 제외한 소속 모든 유저 조회
        List<User> employees = userRepository.findByCompany_CompanyIdAndRole(companyId, UserRole.EMPLOYEE);

        return employees.stream()
                .filter(user -> user.getRole() != UserRole.PRESIDENT)
                .map(EmployeeResponse::from)
                .collect(Collectors.toList());
    }
}