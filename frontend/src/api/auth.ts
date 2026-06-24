import api from "@/api/axios";
import {
    BuyerSignUpRequest,
    EmployeeSignUpRequest,
    FindIdSendOtpRequest,
    FindIdVerifyOtpRequest,
    FindIdResponse,
    FindPwRequest,
    LoginRequest,
    SellerSignUpRequest,
    ChangeEmailOtpRequest,
    VerifyEmailOtpRequest,
    ChangePhoneOtpRequest,
    VerifyPhoneOtpRequest
} from "@/api/auth.types";

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

// ───────────────────────────────────────────
// 아이디 / 비밀번호 찾기
// ───────────────────────────────────────────
export const sendFindIdOtp = async (request: FindIdSendOtpRequest): Promise<void> => {
    await api.post<void>("/auth/find-id/otp", request);
};

export const verifyFindIdOtp = async (request: FindIdVerifyOtpRequest): Promise<FindIdResponse> => {
    return await api.post<FindIdResponse>("/auth/find-id/otp/verify", request);
};

export const requestFindPassword = async (request: FindPwRequest): Promise<void> => {
    await api.post<void>("/auth/find-pw", request);
};

// ───────────────────────────────────────────
// 회원 정보 변경 인증 (Profile OTP)
// ───────────────────────────────────────────
export const sendEmailChangeOtp = async (request: ChangeEmailOtpRequest): Promise<void> => {
    await api.post<void>("/auth/change-email/otp", request);
};

export const verifyEmailChangeOtp = async (request: VerifyEmailOtpRequest): Promise<void> => {
    await api.post<void>("/auth/change-email/otp/verify", request);
};

export const sendPhoneChangeOtp = async (request: ChangePhoneOtpRequest): Promise<void> => {
    await api.post<void>("/auth/change-phone/otp", request);
};

export const verifyPhoneChangeOtp = async (request: VerifyPhoneOtpRequest): Promise<void> => {
    await api.post<void>("/auth/change-phone/otp/verify", request);
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
    return await api.post<string>("/common/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

