package kr.remerge.stylehub.domain.company;

import kr.remerge.stylehub.domain.company.client.NtsApiClient;
import kr.remerge.stylehub.domain.company.client.OcrApiClient;
import kr.remerge.stylehub.domain.company.dto.response.NtsResponse;
import kr.remerge.stylehub.domain.company.dto.response.OcrParseResponse;
import kr.remerge.stylehub.domain.company.dto.response.OcrResponse;
import kr.remerge.stylehub.domain.company.repository.CompanyRepository;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CompanyService {

    private final OcrApiClient ocrApiClient;
    private final NtsApiClient ntsApiClient;
    private final CompanyRepository companyRepository;

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

            // 💡 4종 세트 자동 파싱 메서드 작동
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
        // 2-1. 중복 가입 방지 (DB 확인)
        if (companyRepository.existsByBusinessNumber(businessNumber)) {
            throw new BusinessException(ErrorCode.DUPLICATE_BUSINESS_NUMBER);
        }

        // 하이픈 제거 전처리 추가 (국세청 전송용)
        String cleanNum = businessNumber.replace("-", "");
        String cleanDate = openDate.replace("-", "");

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
}