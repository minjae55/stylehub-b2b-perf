package kr.remerge.stylehub.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/**
 * 서비스 전체에서 사용하는 에러 코드 모음.
 * 하이픈(-)이나 언더바(_)를 통해 도메인별 코드를 체계적으로 관리합니다.
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // ───────────────────────────────────────────
    // 인증 / 인가 (AUTH)
    // ───────────────────────────────────────────
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "AUTH_001", "로그인이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "AUTH_002", "접근 권한이 없습니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH_003", "유효하지 않은 토큰입니다."),
    EXPIRED_ACCESS_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH_004", "액세스 토큰이 만료되었습니다."),
    REFRESH_TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "AUTH_005", "리프레시 토큰이 만료되었습니다."),
    OTP_EXPIRED(HttpStatus.BAD_REQUEST, "AUTH_006", "인증 시간이 만료되었습니다. 다시 시도해 주세요."),
    INVALID_OTP_CODE(HttpStatus.BAD_REQUEST, "AUTH_007", "인증번호가 일치하지 않습니다."),

    // ───────────────────────────────────────────
    // 유저 (USER)
    // ───────────────────────────────────────────
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "USER_001", "유저를 찾을 수 없습니다."),
    INVALID_PASSWORD(HttpStatus.UNAUTHORIZED, "USER_002", "비밀번호가 올바르지 않습니다."),
    LOGIN_ATTEMPTS_EXCEEDED(HttpStatus.UNAUTHORIZED, "USER_003", "로그인 시도 횟수를 초과했습니다."),
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "USER_004", "이미 사용 중인 이메일입니다."),
    USER_PENDING(HttpStatus.FORBIDDEN, "USER_005", "승인 대기 중인 계정입니다."),
    USER_SUSPENDED(HttpStatus.FORBIDDEN, "USER_006", "정지된 계정입니다."),
    USER_DELETED(HttpStatus.FORBIDDEN, "USER_007", "탈퇴한 계정입니다."),

    // ───────────────────────────────────────────
    // 회사 (COMPANY)
    // ───────────────────────────────────────────
    COMPANY_NOT_FOUND(HttpStatus.NOT_FOUND, "COMPANY_001", "회사를 찾을 수 없습니다."),
    DUPLICATE_BUSINESS_NUMBER(HttpStatus.CONFLICT, "COMPANY_002", "이미 등록된 사업자등록번호입니다."),

    // ───────────────────────────────────────────
    // 상품 (PRODUCT)
    // ───────────────────────────────────────────
    PRODUCT_NOT_FOUND(HttpStatus.NOT_FOUND, "PRODUCT_001", "상품을 찾을 수 없습니다."),
    PRODUCT_OPTION_NOT_FOUND(HttpStatus.NOT_FOUND, "PRODUCT_002", "상품 옵션을 찾을 수 없습니다."),
    OUT_OF_STOCK(HttpStatus.BAD_REQUEST, "PRODUCT_003", "재고가 부족합니다."),

    // ───────────────────────────────────────────
    // 주문 (ORDER)
    // ───────────────────────────────────────────
    ORDER_NOT_FOUND(HttpStatus.NOT_FOUND, "ORDER_001", "주문을 찾을 수 없습니다."),
    INVALID_ORDER_STATUS(HttpStatus.BAD_REQUEST, "ORDER_002", "유효하지 않은 주문 상태입니다."),
    ORDER_CANCEL_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "ORDER_003", "취소할 수 없는 주문입니다."),

    // ───────────────────────────────────────────
    // 견적 (QUOTE)
    // ───────────────────────────────────────────
    QUOTE_NOT_FOUND(HttpStatus.NOT_FOUND, "QUOTE_001", "견적서를 찾을 수 없습니다."),
    QUOTE_EXPIRED(HttpStatus.BAD_REQUEST, "QUOTE_002", "만료된 견적서입니다."),

    // ───────────────────────────────────────────
    // 계약 (CONTRACT)
    // ───────────────────────────────────────────
    CONTRACT_NOT_FOUND(HttpStatus.NOT_FOUND, "CONTRACT_001", "계약서를 찾을 수 없습니다."),
    CONTRACT_ALREADY_SIGNED(HttpStatus.BAD_REQUEST, "CONTRACT_002", "이미 서명된 계약서입니다."),

    // ───────────────────────────────────────────
    // 소싱 (SOURCING)
    // ───────────────────────────────────────────
    SAMPLE_OPTION_NOT_CONFIGURED(HttpStatus.BAD_REQUEST, "SOURCING_001", "선택한 옵션은 현재 샘플 주문을 이용할 수 없습니다."),
    SOURCING_NOT_FOUND(HttpStatus.NOT_FOUND, "SOURCING_002", "소싱 요청을 찾을 수 없습니다."),

    // ───────────────────────────────────────────
    // 카테고리 (CATEGORY)
    // ───────────────────────────────────────────
    CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "CATEGORY_001", "카테고리를 찾을 수 없습니다."),
    INVALID_CATEGORY_COUNT(HttpStatus.BAD_REQUEST, "CATEGORY_002", "선호 카테고리는 3개에서 5개 사이여야 합니다."),

    // ───────────────────────────────────────────
    // 공통 (COMMON)
    // ───────────────────────────────────────────
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "COMMON_001", "잘못된 입력값입니다."),
    EMPTY_FILE(HttpStatus.BAD_REQUEST, "COMMON_002", "업로드한 파일이 비어있습니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON_003", "서버 오류가 발생했습니다."),
    FILE_UPLOAD_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON_004", "파일 업로드 중 오류가 발생했습니다."),
    ADDRESS_NOT_FOUND(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON_004", "파일 업로드 중 오류가 발생했습니다.");
    private final HttpStatus httpStatus; // 💡 400, 500 대신 HttpStatus 객체로 명확히 관리
    private final String code;           // 💡 프론트엔드가 식별할 비즈니스 커스텀 에러 코드 (ex: COMPANY_002)
    private final String message;        // 에러 메시지
}