package kr.remerge.stylehub.global.auth.dto.find;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record FindIdSendOtpRequest(
    @NotBlank(message = "이름은 필수 입력 항목입니다.")
    String name,

    @NotBlank(message = "휴대폰 번호는 필수 입력 항목입니다.")
    @Pattern(regexp = "^\\d{10,11}$", message = "휴대폰 번호는 하이픈(-) 없이 10~11자리 숫자만 입력 가능합니다.")
    String phone
) {}