package kr.remerge.stylehub.global.response;

import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.Getter;

import java.util.Map;

// 에러 발생 시 클라이언트에게 반환하는 응답 형식
@Getter
public class ErrorResponse {

    private final int status;           // HTTP 상태 코드
    private final String code;          // 에러 코드명 (ex. USER_NOT_FOUND)
    private final String message;       // 에러 메시지
    private final Map<String, String> fieldErrors;  // @Valid 실패 시 필드별 에러

    private ErrorResponse(int status, String code, String message,
                          Map<String, String> fieldErrors) {
        this.status = status;
        this.code = code;
        this.message = message;
        this.fieldErrors = fieldErrors;
    }

    // 일반 비즈니스 예외용
    public static ErrorResponse of(ErrorCode errorCode) {
        return new ErrorResponse(
                errorCode.getHttpStatus(),
                errorCode.name(),
                errorCode.getMessage(),
                null
        );
    }

    // @Valid 유효성 검사 실패용
    public static ErrorResponse ofValidation(Map<String, String> fieldErrors) {
        return new ErrorResponse(
                400,
                ErrorCode.INVALID_INPUT.name(),
                ErrorCode.INVALID_INPUT.getMessage(),
                fieldErrors
        );
    }
}