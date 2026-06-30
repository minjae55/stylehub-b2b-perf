import api from "@/api/axios";
import {UserResponse} from "../auth/auth.types"; // auth.types에서 가져옴
import {UpdateProfileRequest} from "./user.types";
import {UpdateProfilePayload} from "@/api/auth/auth.service"; // user.types에서 가져옴

// ───────────────────────────────────────────
// 내 정보 조회
// ───────────────────────────────────────────
export const getMe = async (): Promise<UserResponse> => {
    // 인터셉터가 .data.data를 이미 깠기 때문에,
    // 이제 여기서 data.data를 또 쓰지 않고 바로 받아온 결과(UserResponse)를 리턴합니다.
    return await api.get<UserResponse>("/users/me");
};

// ───────────────────────────────────────────
// 내 정보 수정
// ───────────────────────────────────────────
export const updateMe = async (request: UpdateProfileRequest): Promise<UserResponse> => {
    return await api.patch<UserResponse>("/users/me", request);
};

// ───────────────────────────────────────────
// 회원 탈퇴
// ───────────────────────────────────────────
export const withdrawMe = async (): Promise<void> => {
    await api.delete<void>("/users/me");
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

/**
 * 최종 회원 정보 업데이트 (PATCH)
 */
export const updateProfileInfo = async (payload: UpdateProfilePayload) => {
    const { data } = await api.patch("/users/me", payload);
    return data; // 서버에서 반환한 최신 유저 객체
};