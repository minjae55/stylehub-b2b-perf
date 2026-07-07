// ── 회사 권한 심사 상태 타입 ──────────────────────────────────────────────────
export type SellerStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

// ── 백엔드 API 및 컴포넌트 공통 회사 정보 인터페이스 ───────────────────────────
export interface CompanyDetail {
    companyName: string;
    businessNumber: string;
    representativeName: string;
    representativePhone: string;
    websiteUrl: string;
    description: string;
    address: string;
    addressDetail: string;
    logoUrl: string | null;
    businessLicenseUrl: string | null;
    sellerStatus: SellerStatus;
}

// ── 회사 정보 업데이트/심사 요청 시 전송할 페이로드 데이터 ─────────────────────
export interface UpdateCompanyPayload {
    companyName?: string;
    businessNumber?: string;
    representativeName?: string;
    representativePhone?: string;
    websiteUrl?: string;
    description?: string;
    address?: string;
    addressDetail?: string;
    logoUrl?: string | null;
    businessLicenseUrl?: string | null;
}

// ── 회사 직원 관리 타입 ───────────────────────────────────────────────────────

export type MemberRole = "ADMIN" | "PRESIDENT" | "EMPLOYEE";
export type BusinessRole = "BUYER" | "SELLER" | "BOTH";
export type MemberUserStatus = "PENDING" | "APPROVED" | "SUSPENDED" | "DELETED";

/**
 * 직원 목록 조회 응답 DTO
 */
export interface CompanyMemberResponse {
    userId: number;
    name: string;
    email: string;
    phone: string | null;
    role: MemberRole;
    businessRole: BusinessRole;
    status: MemberUserStatus;
    profileImageUrl: string | null;
    lastLoginAt: string | null;   // ISO string
    createdAt: string;            // ISO string → joinedAt 표시용
}

/**
 * 직원 초대 요청 페이로드
 */
export interface InviteMemberRequest {
    email: string;
}

/**
 * 직원 상태 변경 요청 페이로드
 */
export interface UpdateMemberStatusRequest {
    status: MemberUserStatus;
}

/**
 * 직원 권한/역할 수정 요청 페이로드
 */
export interface UpdateMemberRoleRequest {
    role?: MemberRole;
    businessRole?: BusinessRole;
}
