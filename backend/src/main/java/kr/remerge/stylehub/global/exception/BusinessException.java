package kr.remerge.stylehub.global.exception;

import lombok.Getter;

// 비즈니스 로직에서 발생하는 커스텀 예외
// ErrorCode를 담아서 던지면 GlobalExceptionHandler가 받아서 처리
@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}
