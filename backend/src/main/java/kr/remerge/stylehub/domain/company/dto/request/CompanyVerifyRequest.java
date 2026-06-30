package kr.remerge.stylehub.domain.company.dto.request;

/**
 * 최종 정보 조회를 위해 프론트에서 받을 DTO 객체 (컨트롤러 내부에 정의하거나 별도 파일로 분리 가능)
 */
public record CompanyVerifyRequest(
        String businessNumber,
        String companyName,
        String representativeName,
        String openDate
) {
}