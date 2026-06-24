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

export interface FindPwRequest {
    email: string;
    name: string;
}

// ───────────────────────────────────────────
// 회원 정보 변경 인증 (Profile OTP)
// ───────────────────────────────────────────

export interface ChangeEmailOtpRequest {
    targetValue: string; // 변경할 이메일 주소
}

export interface VerifyEmailOtpRequest {
    targetValue: string;
    otpCode: string; // 6자리 인증번호
}

export interface ChangePhoneOtpRequest {
    targetValue: string; // 변경할 연락처
}

export interface VerifyPhoneOtpRequest {
    targetValue: string;
    otpCode: string; // 6자리 인증번호
}
