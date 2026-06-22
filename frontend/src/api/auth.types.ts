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
// 요청 타입 (Request Interfaces)
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
    businessLicenseUrl?: string;
    preferredCategoryIds: number[];
}

export interface SellerSignUpRequest {
    email: string;
    password: string;
    name: string;
    phone?: string;
    businessNumber: string;
    companyName: string;
    representativeName: string;
    address?: string;
    addressDetail?: string;
    businessLicenseUrl?: string;
    websiteUrl?: string;
    storeType: "OFFLINE" | "ONLINE" | "BOTH"; // 백엔드 Java Enum 대문자 싱크
    brandName?: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    preferredCategoryIds: number[]; // 정수형 배열 변환본 받아오기
    handledCategoryIds: number[];   // 정수형 배열 변환본 받아오기
}

export interface EmployeeSignUpRequest {
    email: string;
    password: string;
    name: string;
    phone: string;
    businessNumber: string; // 하이픈 제거된 10자리 숫자 문자열
    businessRole: "BUYER" | "SELLER"; // Java Enum 대응 대문자 싱크
    preferredCategoryIds?: number[]; // 선택 사항이므로 optional 처리 및 숫자 배열
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