package kr.remerge.stylehub.domain.company.dto.response;

public record OcrParseResponse(
        String businessNumber,
        String companyName,
        String representativeName,
        String openDate
) {
}