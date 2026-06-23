package kr.remerge.stylehub.global.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.Getter;

/**
 * 모든 API 응답을 감싸는 공통 응답 객체.
 * Controller는 항상 ResponseEntity<ApiResponse<T>> 형태로 리턴하는 것을 권장.
 */
@Getter
@JsonInclude(JsonInclude.Include.NON_NULL) // null 필드는 응답 JSON에서 제외 (취향에 따라 제거 가능)
public final class ApiResponse<T> {

    private final boolean success;
    private final T data;
    private final String message;
    private final String code; // 비즈니스 에러 코드. 성공 응답에서는 항상 null

    private ApiResponse(boolean success, T data, String message, String code) {
        this.success = success;
        this.data = data;
        this.message = message;
        this.code = code;
    }

    // ===================== 성공 응답 =====================

    /** 1. 데이터만 있는 성공 응답 */
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null, null);
    }

    /** 2. 데이터 + 메시지가 있는 성공 응답 */
    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, data, message, null);
    }

    /** 3. 데이터도 메시지도 없는 단순 성공 응답 (ex: 수정, 삭제 완료) */
    public static <T> ApiResponse<T> success() {
        return new ApiResponse<>(true, null, null, null);
    }

    /** 4. 메시지만 있는 성공 응답 (ex: "회원가입이 완료되었습니다.") */
    public static <T> ApiResponse<T> successWithMessage(String message) {
        return new ApiResponse<>(true, null, message, null);
    }

    // ===================== 실패 응답 =====================

    /** 5. 메시지만 있는 실패 응답 */
    public static <T> ApiResponse<T> fail(String message) {
        return new ApiResponse<>(false, null, message, null);
    }

    /** 6. 에러 코드 + 메시지가 있는 실패 응답 */
    public static <T> ApiResponse<T> fail(String code, String message) {
        return new ApiResponse<>(false, null, message, code);
    }

    /** 7. ErrorCode enum 기반 실패 응답 — GlobalExceptionHandler에서 가장 많이 쓰는 형태 */
    public static <T> ApiResponse<T> fail(ErrorCode errorCode) {
        return new ApiResponse<>(false, null, errorCode.getMessage(), errorCode.getCode());
    }

    /** 8. ErrorCode + 부가 데이터 (ex: @Valid 필드별 검증 에러 맵) */
    public static <T> ApiResponse<T> fail(ErrorCode errorCode, T data) {
        return new ApiResponse<>(false, data, errorCode.getMessage(), errorCode.getCode());
    }
}