package kr.remerge.stylehub.global.auth.dto.find;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record FindIdVerifyOtpRequest(
        @NotBlank(message = "이름은 필수 입력 항목입니다.")
        String name,

        @NotBlank(message = "휴대폰 번호는 필수 입력 항목입니다.")
        @Pattern(regexp = "^01(?:0|1|[6-9])\\d{3,4}\\d{4}$", message = "올바른 휴대폰 번호 형식이 아닙니다.")
        String phone,

        @NotBlank(message = "인증번호는 필수 입력 항목입니다.")
        @Pattern(regexp = "^\\d{6}$", message = "인증번호는 숫자 6자리여야 합니다.")
        String code
) {
}