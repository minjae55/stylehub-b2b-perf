package kr.remerge.stylehub.domain.user.dto.response;

public record FindIdResponse(
    String maskedEmail,
    String createdAt
) {}