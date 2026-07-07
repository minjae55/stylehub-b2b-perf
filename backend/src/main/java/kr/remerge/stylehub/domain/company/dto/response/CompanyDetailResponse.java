package kr.remerge.stylehub.domain.company.dto.response;

import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.company.enumtype.SellerStatus;

public record CompanyDetailResponse(
        String companyName,
        String businessNumber,
        String representativeName,
        String representativePhone,
        String websiteUrl,
        String description,
        String address,
        String addressDetail,
        String logoUrl,
        String businessLicenseUrl,
        SellerStatus sellerStatus
) {
    public static CompanyDetailResponse from(Company company) {
        return new CompanyDetailResponse(
                company.getName(),
                company.getBusinessNumber(),
                company.getRepresentativeName(),
                company.getRepresentativePhone(),
                company.getWebsiteUrl(),
                company.getDescription(),
                company.getAddress(),
                company.getAddressDetail(),
                company.getLogoUrl(),
                company.getBusinessLicenseUrl(),
                company.getSellerStatus()
        );
    }
}