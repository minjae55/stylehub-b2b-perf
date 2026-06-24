package kr.remerge.stylehub.domain.user.dto.request;

import jakarta.validation.constraints.NotBlank;

public record VerifyPasswordRequest(
    @NotBlank(message = "비밀번호를 입력해 주세요.")
    String currentPassword
) {}