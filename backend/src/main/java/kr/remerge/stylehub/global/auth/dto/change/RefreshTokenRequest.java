package kr.remerge.stylehub.global.auth.dto.change;

import jakarta.validation.constraints.NotBlank;

// 토큰 재발급 요청 DTO
public record RefreshTokenRequest(

        @NotBlank(message = "리프레시 토큰을 입력해주세요.")
        String refreshToken
) {}
