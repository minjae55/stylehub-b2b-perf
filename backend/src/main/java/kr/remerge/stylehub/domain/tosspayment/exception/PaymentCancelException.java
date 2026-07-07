package kr.remerge.stylehub.domain.tosspayment.exception;

public class PaymentCancelException extends RuntimeException {
    public PaymentCancelException(String message) {
        super(message);
    }
}
