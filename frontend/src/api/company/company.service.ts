import api from "@/api/axios";
import {
    CompanyDetail,
    CompanyMemberResponse,
    InviteMemberRequest,
    UpdateCompanyPayload,
    UpdateMemberRoleRequest,
    UpdateMemberStatusRequest,
} from "./company.types";

// ── 회사 프로필 및 심사 관리 API ──────────────────────────────────────────────

/**
 * 소속 회사 상세 정보 조회
 */
export const getCompanyDetail = (companyId: number): Promise<CompanyDetail> => {
    return api.get<CompanyDetail>(`/company/${companyId}`);
};

/**
 * 회사 정보 변경 및 셀러 권한 심사 신청
 */
export const updateCompanyDetail = (
    companyId: number,
    request: UpdateCompanyPayload
): Promise<void> => {
    return api.patch<void>(`/company/${companyId}`, request);
};

// ── 직원 관리 API ─────────────────────────────────────────────────────────────

/**
 * 소속 회사 직원 목록 조회
 */
export const getCompanyMembers = (companyId: number): Promise<CompanyMemberResponse[]> => {
    return api.get<CompanyMemberResponse[]>(`/company/${companyId}/employees`);
};

/**
 * 직원 이메일 초대
 */
export const inviteMember = async (request: InviteMemberRequest): Promise<void> => {
    await api.post<void>("/company/invite", request);
};

/**
 * 직원 계정 상태 변경 (활성화 / 비활성화)
 */
export const updateMemberStatus = async (
    userId: number,
    request: UpdateMemberStatusRequest
): Promise<void> => {
    await api.patch<void>(`/company/${userId}/status`, request);
};

/**
 * 초대 메일 재발송
 */
export const resendMemberInvite = async (userId: number): Promise<void> => {
    await api.post<void>(`/company/${userId}/resend-invite`);
};
/**
 * 직원의 UserRole 및 BusinessRole 변경
 */
export const updateMemberRole = async (
    userId: number,
    request: UpdateMemberRoleRequest
): Promise<void> => {
    await api.patch<void>(`/company/${userId}/role`, request);
};