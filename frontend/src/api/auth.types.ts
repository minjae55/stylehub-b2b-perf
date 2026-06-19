// ───────────────────────────────────────────
// 요청 타입
// ───────────────────────────────────────────

export interface LoginRequest {
    email: string;
    password: string;
}

export interface BuyerSignUpRequest {
    email: string;
    password: string;
    name: string;
    phone?: string;
    businessNumber: string;
    companyName: string;
    representativeName: string;
    address?: string;
    addressDetail?: string;
    businessLicenseUrl?: string; // S3 업로드 후 받은 URL
    preferredCategoryIds: number[]; // 디비 스펙에 맞춘 숫자 배열 (JPA Long과 매핑)
}

// ───────────────────────────────────────────
// 응답 타입
// ───────────────────────────────────────────

export interface UserResponse {
    userId: number
    companyId: number
    email: string;
    name: string;
    phone: string | null;
    role: "ADMIN" | "PRESIDENT" | "EMPLOYEE";
    businessRole: "BUYER" | "SELLER" | "BOTH";
    profileImageUrl: string | null;
    status: "PENDING" | "APPROVED" | "SUSPENDED" | "DELETED";
    createdAt: string;
}