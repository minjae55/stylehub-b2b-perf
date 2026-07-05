package kr.remerge.stylehub.domain.company.dto.request;

import kr.remerge.stylehub.domain.user.enumtype.BusinessRole;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;

/**
 * 직원 역할 및 비즈니스 거래 권한 수정 요청 DTO
 */
public record UpdateMemberRoleRequest(
        UserRole role,          // ADMIN, EMPLOYEE 등 (선택적 변경 가능)
        BusinessRole businessRole // BUYER, SELLER, BOTH 등 (선택적 변경 가능)
) {
}