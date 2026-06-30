package kr.remerge.stylehub.domain.company.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record NtsResponse(
        @JsonProperty("status_code") String statusCode,
        @JsonProperty("request_cnt") int requestCnt,
        @JsonProperty("valid_cnt") int validCnt,
        @JsonProperty("data") List<NtsValidationDetail> data
) {
    public record NtsValidationDetail(
            @JsonProperty("b_no") String bNo,
            @JsonProperty("valid") String valid,         // "01" 이면 인증 성공
            @JsonProperty("valid_msg") String validMsg,
            @JsonProperty("status") NtsStatus status     // 사업자 상태 (휴폐업 등)
    ) {
    }

    public record NtsStatus(
            @JsonProperty("b_stt") String bStt,
            @JsonProperty("b_stt_cd") String bSttCd,     // "01": 계속사업자
            @JsonProperty("tax_type") String taxType,
            @JsonProperty("tax_type_cd") String taxTypeCd
    ) {
    }
}