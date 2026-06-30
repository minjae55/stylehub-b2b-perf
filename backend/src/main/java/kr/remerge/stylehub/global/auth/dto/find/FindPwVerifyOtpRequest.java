package kr.remerge.stylehub.global.auth.dto.find;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record FindPwVerifyOtpRequest(
        @NotBlank(message = "이메일은 필수 입력 항목입니다.")
        @Email(message = "올바른 이메일 형식이 아닙니다.")
        String email,

        @NotBlank(message = "인증번호는 필수 입력 항목입니다.")
        @Pattern(regexp = "^\\d{6}$", message = "인증번호는 숫자 6자리여야 합니다.")
        String code
) {
}