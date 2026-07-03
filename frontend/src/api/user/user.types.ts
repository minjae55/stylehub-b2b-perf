// ───────────────────────────────────────────
// 회원 정보 변경 인증 (Profile OTP)
// ───────────────────────────────────────────
export interface ChangeEmailOtpRequest { target: string; }
export interface VerifyEmailOtpRequest { target: string; otpCode: string; }
export interface ChangePhoneOtpRequest { target: string; }
export interface VerifyPhoneOtpRequest { target: string; otpCode: string; }
export interface UpdateProfilePayload { email: string; phone: string; profileImageUrl: string | null; }

// ───────────────────────────────────────────
// 기본 배송, 발송, 반품 주소지 관리 (API 통신용 스펙)
// ───────────────────────────────────────────

export type DefaultType = "return" | "shipping" | "receiving";

/** 1. 백엔드 API에서 내려주는 주소 객체 */
export interface AddressResponse {
    addressId: number;
    companyId: number;
    addressName: string;
    zipcode: string;
    address: string;
    addressDetail: string;
    createdAt: string;
    deletedAt: string | null;
}

/** 2. 주소 등록(POST) 및 수정(PUT) 시 Request Body 스펙 */
export interface AddressPayload {
    addressName: string;
    zipcode: string;
    address: string;
    addressDetail: string;
}

/** 3. 기본 설정값 단건 조회 응답 스펙 */
export interface CompanyDefaultsResponse { returnAddressId: number | null; }
export interface UserDefaultsResponse    { shippingAddressId: number | null; receivingAddressId: number | null; }

/** 4. 기본지 변경 요청용 페이로드 (PATCH) */
export interface UpdateDefaultAddressRequest {
    addressId: number;
    defaultType: DefaultType;
}