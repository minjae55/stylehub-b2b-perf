package kr.remerge.stylehub.domain.order.checkout.exception;

import kr.remerge.stylehub.domain.order.checkout.dto.CheckoutValidationErrorResponse;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.Getter;

@Getter
public class CheckoutValidationException extends RuntimeException {

    private final ErrorCode errorCode;
    private final CheckoutValidationErrorResponse response;

    public CheckoutValidationException(CheckoutValidationErrorResponse response) {
        super(ErrorCode.CHECKOUT_VALIDATION_FAILED.getMessage());
        this.errorCode = ErrorCode.CHECKOUT_VALIDATION_FAILED;
        this.response = response;
    }
}
