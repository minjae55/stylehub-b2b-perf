import api from "./axios";
import type {ApiResponse} from "./types";
import {BuyerSignUpRequest, LoginRequest, UserResponse} from "@/api/auth.types";
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

// ───────────────────────────────────────────
// [추가] 바이어 회원가입
// ───────────────────────────────────────────
/**
 * 백엔드 @PostMapping("/signup/buyer")와 매핑되는 바이어 회원가입 요청입니다.
 */
export const signUpBuyer = async (request: BuyerSignUpRequest): Promise<string> => {
    // 백엔드가 ResponseEntity<ApiResponse<Void>>를 리턴하므로 데이터는 null(혹은 void) 처리
    const {data} = await api.post<ApiResponse<null>>("users/signup/buyer", request);
    return data.message ?? "바이어 가입 신청이 완료되었습니다.";
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

// ───────────────────────────────────────────
// 공통 파일 업로드
// ───────────────────────────────────────────
/**
 * 파일을 multipart/form-data 형태로 백엔드에 업로드하고 저장된 S3 URL을 반환받습니다.
 */
export const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    // API 규칙 4번 준수: ApiResponse<T> 형태로 받기
    // 백엔드가 업로드 성공 시 URL 문자열을 주거나 객체에 담아준다면 그에 맞춰 <string> 혹은 <{fileUrl: string}> 등으로 타입을 지정하세요.
    const {data} = await api.post<ApiResponse<string>>("/common/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data", // 파일 업로드를 위한 헤더 지정
        },
    });

    return data.data; // 업로드된 S3 URL 경로 반환
};