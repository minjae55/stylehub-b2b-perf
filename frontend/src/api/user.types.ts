// auth.types.ts에 있는 검증된 유저 타입을 그대로 가져와 연결합니다.
import { UserResponse } from "./auth.types";

/**
 * 프로필 및 회원 정보 수정 요청 (PATCH /users/me)에 사용되는 객체입니다.
 */
export interface UpdateProfileRequest {
    email: string;
    phone: string | null; // auth.types.ts의 스펙(string | null)과 싱크를 맞춤
    profileImageUrl: string | null;
}

/**
 * 1. 정보 수정 전 비밀번호 검증 요청 객체
 */
export interface VerifyPasswordRequest {
    currentPassword: string;
}

/**
 * 2. 새 이메일/핸드폰 인증번호(OTP) 발송 요청 객체
 */
export interface SendChangeOtpRequest {
    targetValue: string; // 새 이메일 주소 또는 새 핸드폰 번호
}

/**
 * 3. 발송된 인증번호 검증 요청 객체
 */
export interface VerifyChangeOtpRequest {
    targetValue: string; // 새 이메일 주소 또는 새 핸드폰 번호
    otpCode: string;     // 유저가 입력한 인증번호 6자리
}