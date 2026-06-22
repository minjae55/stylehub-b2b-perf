package kr.remerge.stylehub.domain.user.dto.request;

import jakarta.validation.constraints.NotBlank;

public record FindIdVerifyOtpRequest(
    @NotBlank(message = "이름은 필수 입력 항목입니다.")
    String name,

    @NotBlank(message = "휴대폰 번호는 필수 입력 항목입니다.")
    String phone,

    @NotBlank(message = "인증코드는 필수 입력 항목입니다.")
    String code
) {}