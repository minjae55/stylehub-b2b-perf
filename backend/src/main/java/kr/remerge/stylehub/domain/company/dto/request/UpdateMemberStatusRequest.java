package kr.remerge.stylehub.domain.company.dto.request;

import kr.remerge.stylehub.domain.user.enumtype.UserStatus;

public record UpdateMemberStatusRequest(
        UserStatus status
) {
}