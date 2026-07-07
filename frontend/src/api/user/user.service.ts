import api from "@/api/axios";
import {UserResponse} from "../auth/auth.types";
import {
    AddressPayload,
    AddressResponse,
    ChangeEmailOtpRequest,
    ChangePhoneOtpRequest,
    CompanyDefaultsResponse,
    UpdateDefaultAddressRequest,
    UpdateProfilePayload,
    UserDefaultsResponse,
    VerifyEmailOtpRequest,
    VerifyPhoneOtpRequest
} from "./user.types";
// ───────────────────────────────────────────
// 내 정보 조회
// ───────────────────────────────────────────
export const getMe = async (): Promise<UserResponse> => {
    // 인터셉터가 .data.data를 이미 깠기 때문에,
    // 이제 여기서 data.data를 또 쓰지 않고 바로 받아온 결과(UserResponse)를 리턴합니다.
    return await api.get<UserResponse>("/users/me");
};

// ───────────────────────────────────────────
// 내 정보 검증 및 수정
// ───────────────────────────────────────────
/**
 * 내 프로필 탭 진입 전 비밀번호 재확인 검증
 */
export const verifyGatePassword = async (password: string): Promise<void> => {
    // 백엔드 엔드포인트 스펙에 맞게 주소 조정 (예: /users/me/verify-password)
    await api.post("/users/me/verify-password", { currentPassword: password });
};

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

/**
 * 최종 회원 정보 업데이트 (PATCH)
 */
export const updateProfileInfo = async (payload: UpdateProfilePayload) => {
    return await api.patch<UserResponse>("/users/profile", payload);
};

/**
 * 비밀번호 변경
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    // axios 인터셉터가 ApiResponse를 언랩하므로 리턴 타입을 void로 처리합니다.
    await api.post("/users/me/password", {
        currentPassword,
        newPassword
    });
}
// ───────────────────────────────────────────
// 기본 배송, 발송, 반품 주소지 관리
// ───────────────────────────────────────────

// 1. 전체 주소록 목록 조회
export const getCompanyAddresses = async (): Promise<AddressResponse[]> => {
    return await api.get<AddressResponse[]>("/addresses");
};

// 2. 회사/유저 기본 설정 조회
export const getAddressDefaults = async (): Promise<{ company: CompanyDefaultsResponse; user: UserDefaultsResponse }> => {
    return await api.get<{ company: CompanyDefaultsResponse; user: UserDefaultsResponse }>("/addresses/defaults");
};

// 3. 새 주소 등록
export const createAddress = async (payload: AddressPayload): Promise<AddressResponse> => {
    return await api.post<AddressResponse>("/addresses", payload);
};

// 4. 주소 수정
export const updateAddress = async (addressId: number, payload: AddressPayload): Promise<AddressResponse> => {
    return await api.put<AddressResponse>(`/addresses/${addressId}`, payload);
};

// 5. 주소 삭제
export const deleteAddress = async (addressId: number): Promise<void> => {
    await api.delete<void>(`/addresses/${addressId}`);
};

// 6. 기본 주소지 변경 (출고지/배송지/수령지 세팅)
export const updateDefaultAddress = async (payload: UpdateDefaultAddressRequest): Promise<void> => {
    await api.patch<void>("/addresses/defaults", payload);
};