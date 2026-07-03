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
    OTP_EXPIRED(HttpStatus.UNAUTHORIZED, "AUTH_006", "인증 시간이 만료되었습니다. 다시 요청해 주세요."),
    INVALID_OTP_CODE(HttpStatus.BAD_REQUEST, "AUTH_007", "인증번호가 일치하지 않습니다."),
    UNVERIFIED_EMAIL(HttpStatus.FORBIDDEN, "AUTH_008", "인증되지 않은 이메일입니다."),
    UNVERIFIED_PHONE(HttpStatus.FORBIDDEN, "AUTH_009", "인증되지 않은 휴대폰 번호입니다."),
    SMS_SEND_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "AUTH_010", "문자 발송 중에 오류가 발생하였습니다."),
    EMAIL_SEND_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "AUTH_011", "이메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요."),

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
    INVALID_BUSINESS_ROLE(HttpStatus.BAD_REQUEST, "USER_008", "유효하지 않은 비즈니스 역할입니다."),
    INVALID_LOGIN_CREDENTIALS(HttpStatus.BAD_REQUEST, "USER_009", "이메일 또는 비밀번호가 올바르지 않습니다."),
    DUPLICATE_PHONE_NUMBER(HttpStatus.CONFLICT, "USER_010", "이미 사용 중인 핸드폰 번호입니다."),

    // ───────────────────────────────────────────
    // 회사 (COMPANY)
    // ───────────────────────────────────────────
    COMPANY_NOT_FOUND(HttpStatus.NOT_FOUND, "COMPANY_001", "회사를 찾을 수 없습니다."),
    DUPLICATE_BUSINESS_NUMBER(HttpStatus.CONFLICT, "COMPANY_002", "이미 등록된 사업자등록번호입니다."),
    COMPANY_NOT_APPROVED(HttpStatus.FORBIDDEN, "COMPANY_003", "승인되지 않은 공급업체입니다."),
    INVALID_BUSINESS_INFORMATION(HttpStatus.BAD_REQUEST, "COMPANY_004", "국세청 등록 정보와 일치하지 않는 사업자 정보입니다."),
    NOT_CLOTHING_BUSINESS(HttpStatus.BAD_REQUEST, "COMPANY_005", "의류 및 패션 관련 업종의 셀러만 가입이 가능합니다."),
    OCR_PARSING_FAILED(HttpStatus.BAD_REQUEST, "COMPANY_006", "사업자등록증 이미지 글자 인식에 실패했습니다."),
    INVALID_COMPANY_STATUS(HttpStatus.BAD_REQUEST, "COMPANY_007", "가입할 수 없는 상태의 회사입니다."),
    INVALID_JOIN_ROLE(HttpStatus.BAD_REQUEST, "COMPANY_008", "올바르지 않은 가입 입니다."),
    COMPANY_PENDING(HttpStatus.CONFLICT, "COMPANY_009", "승인 대기 중인 회사입니다."),
    COMPANY_SUSPENDED(HttpStatus.CONFLICT, "COMPANY_010", "이용 정지된 회사입니다."),
    COMPANY_DELETED(HttpStatus.CONFLICT, "COMPANY_011", "삭제된 회사 정보입니다."),

    // ───────────────────────────────────────────
    // 상품 (PRODUCT)
    // ───────────────────────────────────────────
    PRODUCT_NOT_FOUND(HttpStatus.NOT_FOUND, "PRODUCT_001", "상품을 찾을 수 없습니다."),
    PRODUCT_OPTION_NOT_FOUND(HttpStatus.NOT_FOUND, "PRODUCT_002", "상품 옵션을 찾을 수 없습니다."),
    OUT_OF_STOCK(HttpStatus.BAD_REQUEST, "PRODUCT_003", "재고가 부족합니다."),
    OPTION_INACTIVE(HttpStatus.BAD_REQUEST, "PRODUCT_004", "현재 판매 중인 옵션이 아닙니다."),
    MOQ_NOT_MET(HttpStatus.BAD_REQUEST, "PRODUCT_005", "최소 주문 수량을 충족하지 못했습니다."),
    SAMPLE_NOT_AVAILABLE(HttpStatus.BAD_REQUEST, "PRODUCT_006", "샘플 주문이 불가능한 상품입니다."),
    SAMPLE_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST, "PRODUCT_007", "샘플 최대 주문 수량을 초과했습니다."),

    // ───────────────────────────────────────────
    // 장바구니 (CART)
    // ───────────────────────────────────────────
    CART_ITEM_EMPTY(HttpStatus.BAD_REQUEST, "CART_001", "선택된 장바구니 상품이 없습니다."),
    INVALID_CART_TYPE(HttpStatus.BAD_REQUEST, "CART_002", "장바구니 타입이 올바르지 않습니다."),
    CART_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "CART_003", "주문할 수 없는 장바구니 상품이 포함되어 있습니다."),
    CHECKOUT_VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "CART_004", "주문할 수 없는 장바구니 상품이 있습니다."),

    // ───────────────────────────────────────────
    // 주문 (ORDER)
    // ───────────────────────────────────────────
    ORDER_NOT_FOUND(HttpStatus.NOT_FOUND, "ORDER_001", "주문을 찾을 수 없습니다."),
    INVALID_ORDER_STATUS(HttpStatus.BAD_REQUEST, "ORDER_002", "유효하지 않은 주문 상태입니다."),
    ORDER_CANCEL_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "ORDER_003", "취소할 수 없는 주문입니다."),
    ORDER_ITEMS_NOT_READY(HttpStatus.CONFLICT, "ORDER_004", "모든 주문 상품의 출고 준비가 완료되지 않았습니다."),
    INVALID_RECEIVER_INFO(HttpStatus.BAD_REQUEST, "ORDER_005","수령인 이름과 연락처를 확인해 주세요."),
    SAMPLE_ORDER_ALREADY_EXISTS(HttpStatus.CONFLICT,"ORDER_006","이미 진행 중인 샘플 주문이 있습니다."),

    // ───────────────────────────────────────────
    // 견적 (QUOTE)
    // ───────────────────────────────────────────
    QUOTE_NOT_FOUND(HttpStatus.NOT_FOUND, "QUOTE_001", "견적서를 찾을 수 없습니다."),
    QUOTE_EXPIRED(HttpStatus.BAD_REQUEST, "QUOTE_002", "만료된 견적서입니다."),
    INVALID_QUOTE_STATUS(HttpStatus.BAD_REQUEST, "QUOTE_003", "변경할 수 없는 견적 상태입니다."),
    QUOTE_SAMPLE_NOT_AVAILABLE(HttpStatus.BAD_REQUEST,"QUOTE_004","샘플 제공이 불가능한 견적서입니다."),
    QUOTE_SAMPLE_ITEM_NOT_FOUND(HttpStatus.BAD_REQUEST,"QUOTE_005","결제할 샘플 품목이 없습니다."),

    // ───────────────────────────────────────────
    // 계약 (CONTRACT)
    // ───────────────────────────────────────────
    CONTRACT_NOT_FOUND(HttpStatus.NOT_FOUND, "CONTRACT_001", "계약서를 찾을 수 없습니다."),
    CONTRACT_ALREADY_SIGNED(HttpStatus.BAD_REQUEST, "CONTRACT_002", "이미 서명된 계약서입니다."),
    CONTRACT_ALREADY_EXISTS(HttpStatus.CONFLICT, "CONTRACT_003", "이미 생성된 계약서가 있습니다."),
    INVALID_CONTRACT_STATUS(HttpStatus.BAD_REQUEST, "CONTRACT_004", "현재 상태에서는 계약서를 처리할 수 없습니다."),
    // ───────────────────────────────────────────
    // 소싱 (SOURCING)
    // ───────────────────────────────────────────
    SAMPLE_OPTION_NOT_CONFIGURED(HttpStatus.BAD_REQUEST, "SOURCING_001", "선택한 옵션은 현재 샘플 주문을 이용할 수 없습니다."),
    SOURCING_NOT_FOUND(HttpStatus.NOT_FOUND, "SOURCING_002", "소싱 요청을 찾을 수 없습니다."),

    // ───────────────────────────────────────────
    // 결제 (PAYMENT)
    // ───────────────────────────────────────────
    PAYMENT_ORDER_MISMATCH(HttpStatus.BAD_REQUEST,"PAYMENT_001","결제 대상 주문 정보가 일치하지 않습니다."),
    PAYMENT_AMOUNT_MISMATCH(HttpStatus.BAD_REQUEST,"PAYMENT_002","결제 요청 금액과 실제 주문 금액이 일치하지 않습니다."),
    PAYMENT_CONFIRM_RESULT_MISMATCH(HttpStatus.INTERNAL_SERVER_ERROR,"PAYMENT_003","결제 승인 결과가 주문 정보와 일치하지 않습니다."),
    PAYMENT_ORDER_STATE_MISMATCH(HttpStatus.CONFLICT,"PAYMENT_004","함께 결제한 주문들의 상태가 일치하지 않습니다."),

    // ───────────────────────────────────────────
    // 카테고리 (CATEGORY)
    // ───────────────────────────────────────────
    CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "CATEGORY_001", "카테고리를 찾을 수 없습니다."),
    INVALID_CATEGORY_COUNT(HttpStatus.BAD_REQUEST, "CATEGORY_002", "선호 카테고리는 3개에서 5개 사이여야 합니다."),

    // ───────────────────────────────────────────
    // 주소 (ADDRESS)
    // ───────────────────────────────────────────
    ADDRESS_NOT_FOUND(HttpStatus.NOT_FOUND, "ADDRESS_001", "존재하지 않거나 이미 삭제된 주소지입니다."),
    UNAUTHORIZED_ACCESS(HttpStatus.FORBIDDEN, "ADDRESS_002", "해당 주소록에 대한 접근 권한이 없습니다."),
    INVALID_ADDRESS_TYPE(HttpStatus.BAD_REQUEST, "ADDRESS_003", "올바르지 않은 주소지 설정 타입입니다."),

    // ───────────────────────────────────────────
    // 배송 (Delivery)
    // ───────────────────────────────────────────
    DELIVERY_NOT_FOUND(HttpStatus.NOT_FOUND, "DELIVERY_001", "배송 정보를 찾을 수 없습니다."),

    // ───────────────────────────────────────────
    // 공통 (COMMON)
    // ───────────────────────────────────────────
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "COMMON_001", "잘못된 입력값입니다."),
    EMPTY_FILE(HttpStatus.BAD_REQUEST, "COMMON_002", "업로드한 파일이 비어있습니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON_003", "서버 오류가 발생했습니다."),
    FILE_UPLOAD_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON_004", "파일 업로드 중 오류가 발생했습니다.");

    private final HttpStatus httpStatus; // 400, 500 대신 HttpStatus 객체로 명확히 관리
    private final String code;           // 프론트엔드가 식별할 비즈니스 커스텀 에러 코드 (ex: COMPANY_002)
    private final String message;        // 에러 메시지
}
