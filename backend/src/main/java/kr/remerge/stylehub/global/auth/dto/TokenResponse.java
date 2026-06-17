package kr.remerge.stylehub.global.auth.dto;

// 로그인/재발급 성공 시 반환하는 토큰 응답 DTO
public record TokenResponse(
        String accessToken,
        String refreshToken
) {
    public static TokenResponse of(String accessToken, String refreshToken) {
        return new TokenResponse(accessToken, refreshToken);
    }
}
