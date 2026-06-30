package kr.remerge.stylehub.domain.company.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public record OcrResponse(
        @JsonProperty("images") List<OcrImage> images
) {
    // 성능 최적화: 정규식 패턴을 상수로 선언하여 매번 컴파일되지 않도록 방지
    private static final Pattern BUSINESS_NUMBER_DASH_PATTERN = Pattern.compile("\\d{3}-\\d{2}-\\d{5}");
    private static final Pattern BUSINESS_NUMBER_PURE_PATTERN = Pattern.compile("\\d{10}");
    private static final Pattern COMPANY_NAME_PATTERN = Pattern.compile("(?:상호|법인명|단체명|명칭)[:\\s]*([^:\\s]{2,20}?(?=(?:대표자|성명|개업|생년월일|주소|생년)))");
    private static final Pattern REPRESENTATIVE_NAME_PATTERN = Pattern.compile("(?:대표자|성명|대표)[:\\s]*([가-힣]{2,4})");
    private static final Pattern OPEN_DATE_PATTERN = Pattern.compile("(?:개업연월일|개업일자|개업일)[:\\s]*(\\d{4})[년.\\s-]*(\\d{2})[월.\\s-]*(\\d{2})");

    /**
     * 1. 사업자번호 추출
     */
    public String extractBusinessNumber() {
        String cleanText = getCleanCompressedText();
        Matcher matcher = BUSINESS_NUMBER_DASH_PATTERN.matcher(cleanText);
        if (matcher.find()) return matcher.group();

        matcher = BUSINESS_NUMBER_PURE_PATTERN.matcher(cleanText);
        return matcher.find() ? matcher.group() : "";
    }

    /**
     * 2. 회사명(상호/법인명/단체명) 추출
     */
    public String extractCompanyName() {
        String cleanText = getCleanCompressedText();
        Matcher matcher = COMPANY_NAME_PATTERN.matcher(cleanText);

        if (matcher.find()) {
            return sanitize(matcher.group(1));
        }
        return "";
    }

    /**
     * 3. 대표자명 추출
     */
    public String extractRepresentativeName() {
        String cleanText = getCleanCompressedText();
        Matcher matcher = REPRESENTATIVE_NAME_PATTERN.matcher(cleanText);

        if (matcher.find()) {
            String name = sanitize(matcher.group(1));
            return name.endsWith("귀하") ? name.substring(0, name.length() - 2).trim() : name; // '귀하' 컷팅 예외처리
        }
        return "";
    }

    /**
     * 4. 개업일자 추출
     */
    public String extractOpenDate() {
        String cleanText = getCleanCompressedText();
        Matcher matcher = OPEN_DATE_PATTERN.matcher(cleanText);

        if (matcher.find()) {
            return matcher.group(1) + "-" + matcher.group(2) + "-" + matcher.group(3);
        }
        return "";
    }

    private String getCleanCompressedText() {
        if (images == null || images.isEmpty() || images.get(0).fields() == null) return "";
        StringBuilder sb = new StringBuilder();
        for (OcrField field : images.get(0).fields()) {
            sb.append(field.inferText());
        }
        return sb.toString().replace("(", "").replace(")", "").trim();
    }

    private String sanitize(String input) {
        if (input == null) return "";
        return input.replaceAll("^[\\s:]+", "").replaceAll("[\\s:]+$", "").trim();
    }

    public record OcrImage(
            @JsonProperty("uid") String uid,
            @JsonProperty("name") String name,
            @JsonProperty("inferResult") String inferResult,
            @JsonProperty("message") String message,
            @JsonProperty("fields") List<OcrField> fields
    ) {
    }

    public record OcrField(
            @JsonProperty("inferText") String inferText,
            @JsonProperty("inferConfidence") double inferConfidence
    ) {
    }
}