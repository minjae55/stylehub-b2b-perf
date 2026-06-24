package kr.remerge.stylehub.global.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record ChangeAuthRequest(
        @NotBlank(message = "인증 대상(이메일 또는 전화번호)은 필수입니다.")
        String target
) {}
