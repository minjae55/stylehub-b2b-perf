// ───────────────────────────────────────────
// 요청 타입 (Request Interfaces)
// ───────────────────────────────────────────

export interface LoginRequest {
    email: string;
    password: string;
    rememberMe: boolean;
}

export interface BuyerSignUpRequest {
    email: string;
    password: string;
    name: string;
    phone?: string;
    businessNumber: string;
    companyName: string;
    zipCode: string;
    representativeName: string;
    representativePhone: string;
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
    zipCode: string
    representativeName: string;
    representativePhone: string;
    address?: string;
    addressDetail?: string;
    businessLicenseUrl?: string;
    websiteUrl?: string;
    storeType: "OFFLINE" | "ONLINE" | "BOTH";
    brandName?: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    preferredCategoryIds: number[];
    handledCategoryIds: number[];
}

export interface EmployeeSignUpRequest {
    email: string;
    password: string;
    name: string;
    phone: string;
    businessNumber: string;
    businessRole: "BUYER" | "SELLER";
    preferredCategoryIds?: number[];
}

// ───────────────────────────────────────────
// 응답 타입
// ───────────────────────────────────────────

export interface UserResponse {
    userId: number;
    companyId: number;
    companyName: string;
    email: string;
    name: string;
    phone: string | null;
    role: "ADMIN" | "PRESIDENT" | "EMPLOYEE";
    businessRole: "BUYER" | "SELLER" | "BOTH";
    profileImageUrl: string | null;
    status: "PENDING" | "APPROVED" | "SUSPENDED" | "DELETED";
    createdAt: string;
}

// ───────────────────────────────────────────
// 회원 가입
// ───────────────────────────────────────────

/** 이메일 인증코드 검증 요청 페이로드 */
export interface VerifyEmailOtpPayload {
    email: string;
    code: string;
}

/** 휴대폰 인증코드 발송 요청 페이로드 */
export interface SendPhoneOtpPayload {
    phone: string;
}

/** 휴대폰 인증코드 검증 요청 페이로드 */
export interface VerifyPhoneOtpPayload {
    phone: string;
    code: string;
}

export interface CompanyLookupResponse {
    companyName: string;
    representativeName: string;
    sellerStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED"; // 백엔드 Enum 명세에 맞춤
}

// ───────────────────────────────────────────
// 아이디 찾기 (휴대폰 본인인증)
// ───────────────────────────────────────────

/**
 * 인증번호(OTP) 발송 요청. 재전송도 동일 타입을 사용합니다.
 */
export interface FindIdSendOtpRequest {
    name: string;
    phone: string; // 하이픈 제거된 숫자만 (ex. "01012345678")
}

/**
 * 발송된 인증번호 검증 요청.
 */
export interface FindIdVerifyOtpRequest {
    name: string;
    phone: string;
    code: string; // 6자리 숫자 문자열
}

/**
 * 인증 성공 시 백엔드가 내려주는 결과.
 * 보안을 위해 이메일은 마스킹된 형태로 내려줍니다 (ex. "fa***ion@example.com").
 */
export interface FindIdResponse {
    maskedEmail: string;
    createdAt: string; // 가입일 (ISO 문자열)
}

// ───────────────────────────────────────────
// 비밀번호 찾기
// ───────────────────────────────────────────

/**
 * 1단계: 이메일 인증번호 발송 요청
 */
export interface FindPwSendOtpRequest {
    email: string;
    name: string;
}

/**
 * 2단계: 인증번호 검증 요청
 */
export interface FindPwVerifyOtpRequest {
    email: string;
    code: string; // 6자리 인증번호
}

/**
 * 2단계 성공 시 백엔드가 내려주는 일회성 비밀번호 재설정 토큰
 */
export interface ResetPasswordTokenResponse {
    resetToken: string;
}

/**
 * 3단계: 최종 비밀번호 재설정 요청
 */
export interface ResetPasswordRequest {
    resetToken: string;
    newPassword: string;
}
// ───────────────────────────────────────────
// OCR 및 국세청 검증 관련 타입 추가
// ───────────────────────────────────────────

export interface OcrResultResponse {
    businessNumber: string;
    companyName: string;
    representativeName: string;
    openDate: string;
}

export interface BusinessVerifyRequest {
    businessNumber: string;
    companyName: string;
    representativeName: string;
    openDate: string;
}