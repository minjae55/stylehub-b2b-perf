package kr.remerge.stylehub.global.exception;

import kr.remerge.stylehub.domain.order.checkout.dto.CheckoutValidationErrorResponse;
import kr.remerge.stylehub.domain.order.checkout.exception.CheckoutValidationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import kr.remerge.stylehub.global.response.ApiResponse;

import java.util.HashMap;
import java.util.Map;

/*
───────────────────────────────────────────
흐름 정리
───────────────────────────────────────────
Service
    → throw new BusinessException(ErrorCode.USER_NOT_FOUND)
        → GlobalExceptionHandler.handleBusinessException()
            → ApiResponse.fail(errorCode)
                → 404 { success: false, code: "USER_NOT_FOUND", message: "유저를 찾을 수 없습니다." }
*/

// 전역 예외 처리 클래스
// @RestControllerAdvice : 모든 Controller에서 발생하는 예외를 여기서 한 번에 처리
// @Slf4j : 로그 출력용
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ───────────────────────────────────────────
    // 비즈니스 예외 처리
    // ───────────────────────────────────────────

    // Service에서 throw new BusinessException(ErrorCode.XXX) 하면 여기서 처리
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException e) {
        ErrorCode errorCode = e.getErrorCode();

        // WARN 레벨로 로그 출력 (비즈니스 예외는 서버 오류가 아님)
        log.warn("[BusinessException] {} : {}", errorCode.name(), errorCode.getMessage());

        return ResponseEntity
                .status(errorCode.getHttpStatus())
                .body(ApiResponse.fail(errorCode));
    }

    @ExceptionHandler(CheckoutValidationException.class)
    public ResponseEntity<ApiResponse<CheckoutValidationErrorResponse>> handleCheckoutValidationException(
            CheckoutValidationException e
    ) {
        ErrorCode errorCode = e.getErrorCode();

        log.warn("[CheckoutValidationException] {} : {}", errorCode.name(), errorCode.getMessage());

        return ResponseEntity
                .status(errorCode.getHttpStatus())
                .body(ApiResponse.fail(errorCode, e.getResponse()));
    }

    // ───────────────────────────────────────────
    // @Valid 유효성 검사 실패 처리
    // ───────────────────────────────────────────

    // RequestDTO에 @Valid 붙였을 때 검증 실패하면 여기서 처리
    // ex) @NotBlank, @Size, @Email 등
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(
            MethodArgumentNotValidException e) {

        // 어떤 필드가 왜 실패했는지 모아서 반환
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError fieldError : e.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        log.warn("[ValidationException] {}", fieldErrors);

        return ResponseEntity
                .status(ErrorCode.INVALID_INPUT.getHttpStatus())
                .body(ApiResponse.fail(ErrorCode.INVALID_INPUT, fieldErrors));
    }

    // ───────────────────────────────────────────
    // 그 외 예상치 못한 예외 처리
    // ───────────────────────────────────────────

    // 위에서 잡지 못한 모든 예외는 여기서 처리
    // 500 에러로 반환, ERROR 레벨로 로그 출력
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("[Exception] 예상치 못한 오류 발생", e);

        return ResponseEntity
                .status(ErrorCode.INTERNAL_SERVER_ERROR.getHttpStatus())
                .body(ApiResponse.fail(ErrorCode.INTERNAL_SERVER_ERROR));
    }
}
