import api from "./axios";
import type {ApiResponse} from "./types";
/*
## API 통신 규칙

1. 모든 API 요청은 `src/api/axios.ts`의 `api` 인스턴스를 사용합니다.
    import api from "@/api/axios";

2. fetch, axios.create()를 새로 만들지 않습니다.
(토큰 재발급, 쿠키 설정이 이미 axios.ts에 구현되어 있음)

3. 도메인별로 src/api/{domain}.ts 파일을 만들어 함수를 작성합니다.
    예: api/user.ts, api/product.ts, api/order.ts

4. 응답 타입은 ApiResponse<T> 제네릭을 사용합니다.
    const { data } = await api.get<ApiResponse<UserResponse>>("/users/me");
return data.data;
*/
// ───────────────────────────────────────────
// 요청 타입
// ───────────────────────────────────────────

export interface LoginRequest {
    email: string;
    password: string;
}

export interface SignUpRequest {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role: "ADMIN" | "PRESIDENT" | "EMPLOYEE";
    businessRole: "BUYER" | "SELLER" | "BOTH";
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

// ───────────────────────────────────────────
// 로그인
// ───────────────────────────────────────────

// 로그인 성공 시 서버가 쿠키로 토큰 발급
// 서버가 내려주는 메시지를 반환 (토스트 등에 사용 가능)
export const login = async (request: LoginRequest): Promise<string> => {
    const {data} = await api.post<ApiResponse<null>>("/auth/login", request);
    return data.message ?? "로그인 되었습니다.";
};

// ───────────────────────────────────────────
// 회원가입
// ───────────────────────────────────────────

export const signUp = async (request: SignUpRequest): Promise<UserResponse> => {
    const { data } = await api.post<ApiResponse<UserResponse>>("/users/signup", request);
    return data.data;
};

// ───────────────────────────────────────────
// 로그아웃
// ───────────────────────────────────────────

export const logout = async (): Promise<void> => {
    await api.post("/auth/logout");
};

// ───────────────────────────────────────────
// 내 정보 조회
// ───────────────────────────────────────────

export const getMe = async (): Promise<UserResponse> => {
    const { data } = await api.get<ApiResponse<UserResponse>>("/users/me");
    return data.data;
};