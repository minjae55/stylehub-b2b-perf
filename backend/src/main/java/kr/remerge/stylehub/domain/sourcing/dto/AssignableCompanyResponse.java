package kr.remerge.stylehub.domain.sourcing.dto;

import kr.remerge.stylehub.domain.company.entity.Company;

// 관리자 수동배정 화면에서 검색 결과로 보여줄 최소 정보
public record AssignableCompanyResponse(
        Integer companyId,
        String name
) {
    public static AssignableCompanyResponse from(Company company) {
        return new AssignableCompanyResponse(company.getCompanyId(), company.getName());
    }
}
