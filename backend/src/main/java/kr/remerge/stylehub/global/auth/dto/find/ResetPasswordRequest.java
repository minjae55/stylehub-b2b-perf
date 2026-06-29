package kr.remerge.stylehub.global.auth.dto.find;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ResetPasswordRequest(
        @NotBlank(message = "재설정 토큰이 누락되었습니다.")
        String resetToken,

        @NotBlank(message = "새 비밀번호는 필수 입력 항목입니다.")
        // 영문, 숫자, 특수문자 조합 8자~20자 사이의 정규식 예시입니다. 팀 내 비밀번호 규칙에 맞게 조정 가능합니다.
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,20}$",
                message = "비밀번호는 영문, 숫자, 특수문자를 포함하여 8자 이상 20자 이하여야 합니다.")
        String newPassword
) {
}