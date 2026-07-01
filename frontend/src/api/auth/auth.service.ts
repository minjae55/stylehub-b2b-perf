import api from "@/api/axios";
import {
    BusinessVerifyRequest,
    BuyerSignUpRequest,
    ChangeEmailOtpRequest,
    ChangePhoneOtpRequest,
    CompanyLookupResponse,
    EmployeeSignUpRequest,
    FindIdResponse,
    FindIdSendOtpRequest,
    FindIdVerifyOtpRequest,
    FindPwSendOtpRequest,
    FindPwVerifyOtpRequest,
    LoginRequest,
    OcrResultResponse,
    ResetPasswordRequest,
    ResetPasswordTokenResponse,
    SellerSignUpRequest,
    SendPhoneOtpPayload,
    VerifyEmailOtpPayload,
    VerifyEmailOtpRequest,
    VerifyPhoneOtpPayload,
    VerifyPhoneOtpRequest
} from "@/api/auth/auth.types";

/*
## API 통신 규칙 준수
*/

// ───────────────────────────────────────────
// 로그인 / 로그아웃
// ───────────────────────────────────────────
export const login = async (request: LoginRequest): Promise<void> => {
    await api.post<void>("/auth/login", request);
};

export const logout = async (): Promise<void> => {
    await api.post("/auth/logout");
};

// ───────────────────────────────────────────
// 회원가입
// ───────────────────────────────────────────
export const signUpBuyer = async (request: BuyerSignUpRequest): Promise<void> => {
    await api.post<void>("/users/signup/buyer", request);
};

export const signUpSeller = async (request: SellerSignUpRequest): Promise<void> => {
    await api.post<void>("/users/signup/seller", request);
};

export const signUpEmployee = async (request: EmployeeSignUpRequest): Promise<void> => {
    await api.post<void>("/users/signup/employee", request);
};

/**
 * 1. 이메일 중복 확인
 * @description 409 상태 코드가 반환되면 중복된 이메일로 판단합니다.
 */
export const checkEmailDuplicate = async (email: string): Promise<void> => {
    await api.get(`/auth/email/check?email=${encodeURIComponent(email)}`);
};

/**
 * 2. 이메일 인증 코드 발송
 */
export const sendEmailOtp = async (email: string): Promise<void> => {
    await api.post("/auth/email/send", {email});
};

/**
 * 3. 이메일 인증 코드 검증
 */
export const verifyEmailOtp = async (payload: VerifyEmailOtpPayload): Promise<void> => {
    await api.post("/auth/email/verify", payload);
};

/**
 * 1. 휴대폰 중복 확인
 * @description 409 상태 코드가 반환되면 중복된 휴대폰으로 판단합니다.
 */
export const checkPhoneDuplicate = async (phone: string): Promise<void> => {
    await api.get(`/auth/phone/check?phone=${encodeURIComponent(phone)}`);
};

/**
 * 2. 휴대폰 인증 번호 발송 (SENS SMS)
 */
export const sendPhoneOtp = async (payload: SendPhoneOtpPayload): Promise<void> => {
    await api.post("/auth/phone/send", payload);
};

/**
 * 3. 휴대폰 인증 번호 검증
 */
export const verifyPhoneOtp = async (payload: VerifyPhoneOtpPayload): Promise<void> => {
    await api.post("/auth/phone/verify", payload);
};

/**
 * 4. 소속 회사 조회 및 가입 가능 여부(승인 상태) 검증
 * @description 비로그인(회원가입 단계)에서 사업자번호로 등록된 회사를 조회합니다.
 */
export const lookupCompany = async (
    businessNumber: string,
    businessRole: "SELLER" | "BUYER"
): Promise<CompanyLookupResponse> => {
    return await api.get<CompanyLookupResponse>(
        `/company/lookup?businessNumber=${businessNumber}&businessRole=${businessRole}`
    );
};

// ───────────────────────────────────────────
// 아이디 / 비밀번호 찾기
// ───────────────────────────────────────────
/**
 * 1단계: 아이디 찾기 인증번호 발송 요청
 * 백엔드 엔드포인트: POST /api/auth/find-id/send-otp
 */
export const sendFindIdOtp = async (request: FindIdSendOtpRequest): Promise<void> => {
    // Axios 인터셉터 구조 덕분에 응답 바디가 비어있어도 성공(200 OK) 시 정상 처리됩니다.
    await api.post<void>("/auth/find-id/send-otp", request);
};

/**
 * 2단계: 인증번호 검증 및 마스킹된 아이디 결과 반환
 * 백엔드 엔드포인트: POST /api/auth/find-id/verify-otp
 */
export const verifyFindIdOtp = async (request: FindIdVerifyOtpRequest): Promise<FindIdResponse> => {
    // 백엔드가 성공 시 ApiResponse<FindIdResponse>를 내려주므로,
    // 인터셉터를 거쳐 최종적으로 FindIdResponse 객체({ maskedEmail, createdAt })가 반환됩니다.
    return await api.post<FindIdResponse>("/auth/find-id/verify-otp", request);
};

/**
 * 1단계: 비밀번호 찾기용 이메일 인증번호 발송
 * POST /api/auth/find-pw/send-otp
 */
export const sendFindPwOtp = async (request: FindPwSendOtpRequest): Promise<void> => {
    await api.post<void>("/auth/find-pw/send-otp", request);
};

/**
 * 2단계: 이메일 인증번호 확인 (성공 시 1회성 resetToken 반환)
 * POST /api/auth/find-pw/verify-otp
 */
export const verifyFindPwOtp = async (request: FindPwVerifyOtpRequest): Promise<ResetPasswordTokenResponse> => {
    return await api.post<ResetPasswordTokenResponse>("/auth/find-pw/verify-otp", request);
};

/**
 * 3단계: 인증 토큰을 검증하고 새 비밀번호로 최종 변경
 * POST /api/auth/find-pw/reset
 */
export const resetPassword = async (request: ResetPasswordRequest): Promise<void> => {
    await api.post<void>("/auth/find-pw/reset", request);
};

// ───────────────────────────────────────────
// 회원 정보 변경 인증 (Profile OTP)
// ───────────────────────────────────────────
export const sendEmailChangeOtp = async (request: ChangeEmailOtpRequest): Promise<void> => {
    await api.post<void>("/auth/change-id/send-otp", request);
};

export const verifyEmailChangeOtp = async (request: VerifyEmailOtpRequest): Promise<void> => {
    await api.post<void>("/auth/change-id/verify-otp", request);
};

export const sendPhoneChangeOtp = async (request: ChangePhoneOtpRequest): Promise<void> => {
    await api.post<void>("/auth/change-phone/send-otp", request);
};

export const verifyPhoneChangeOtp = async (request: VerifyPhoneOtpRequest): Promise<void> => {
    await api.post<void>("/auth/change-phone/verify-otp", request);
};

// ───────────────────────────────────────────
// 회원 정보 수정 (Profile Update)
// ───────────────────────────────────────────

export interface UpdateProfilePayload {
    email: string;
    phone: string;
    profileImageUrl: string | null;
}
// ───────────────────────────────────────────
// 공통 파일 업로드
// ───────────────────────────────────────────
export const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    return await api.post<string>("/upload/image", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

// ───────────────────────────────────────────
// 사업자등록증 OCR
// ───────────────────────────────────────────
export const uploadBusinessLicenseOcr = async (file: File): Promise<OcrResultResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    // 백엔드가 ApiResponse<OcrParseResponse>로 감싸서 주기 때문에
    // 공통 인터셉터가 response.data.data를 정상적으로 분해하여 알맹이만 리턴해 줍니다!
    return await api.post<OcrResultResponse>("/company/ocr", formData, {
        headers: {"Content-Type": "multipart/form-data"},
    });
};

// ───────────────────────────────────────────
// 국세청 사업자 진위 확인
// ───────────────────────────────────────────
export const verifyBusinessInvoice = async (request: BusinessVerifyRequest): Promise<void> => {
    // 성공 시 데이터가 없는 success() 응답이므로 반환 타입은 void
    await api.post<void>("/company/verify", request);
};