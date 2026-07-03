import axios, { AxiosResponse } from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import { ApiResponse, ErrorResponse } from "./types";

// ───────────────────────────────────────────
// Axios 인스턴스 생성
// 팀 전체가 이 인스턴스를 import해서 사용
// fetch나 axios.create()를 새로 만들지 말 것
// ───────────────────────────────────────────
const api = axios.create({
    baseURL: "/api",          // Vite proxy를 통해 Spring Boot(8080)로 연결
    withCredentials: true,    // HttpOnly 쿠키 방식이라 필수 (없으면 쿠키 안 보내짐)
    headers: {
        "Content-Type": "application/json",
    },
});

// ───────────────────────────────────────────
// 응답 인터셉터
// 모든 API 응답이 이 파이프라인을 거쳐서 나감
// ───────────────────────────────────────────
api.interceptors.response.use(
    // ── 정상 응답 처리 ──────────────────────
    // 백엔드가 ApiResponse<T> 형태로 응답하면
    // 실제 데이터인 response.data.data만 언래핑(Unwrapping)해서 반환
    (response: AxiosResponse<ApiResponse<any>>) => {
        return response.data.data;
    },

    // ── 에러 응답 처리 ──────────────────────
    async (error) => {
        const originalRequest = error.config;
        const url = originalRequest.url || "";

        // /auth 요청(로그인, 재발급 등)은 무한 루프 방지를 위해 토큰 재발급 로직에서 제외
        const isAuthRequest = url.includes("/auth");

        // 액세스 토큰 만료(401) 시 리프레시 토큰으로 자동 갱신 시도
        if (!isAuthRequest && error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // api 인스턴스가 아닌 axios 원본으로 요청하여 인터셉터 중복 실행 방지
                await axios.post("/api/auth/refresh", {}, { withCredentials: true });
                return api(originalRequest);
            } catch (refreshError) {
                // 리프레시 토큰까지 만료된 경우 전역 상태 초기화 (ProtectedLayout이 로그인 페이지로 튕김 처리)
                useAuthStore.getState().clearUser();
                return Promise.reject(refreshError);
            }
        }

        // 백엔드 커스텀 에러 포맷(ErrorResponse) 처리
        if (error.response?.data) {
            const serverError = error.response.data as ErrorResponse;

            // catch(err) 문에서 err.message로 백엔드의 한글 에러 메시지를 바로 꺼낼 수 있도록 매핑
            if (serverError.message) {
                error.message = serverError.message;
            }

            // 필요한 경우를 대비해 error 객체 내에 백엔드 원본 에러 구조를 그대로 보존
            error.response.data = serverError;
        } else if (!error.response) {
            error.message = "서버와 연결할 수 없습니다. 서버 구동 상태를 확인하세요.";
        }

        return Promise.reject(error);
    }
);

// ───────────────────────────────────────────
// 커스텀 타입 정의
// ───────────────────────────────────────────
// 인터셉터가 T 자체를 반환하므로 인터페이스 타입을 우회 설정하여
// api.get<User>("/users/me") 사용 시 Promise<User>가 추론되도록 처리
type CustomizedAxios = {
    get<T = any, R = T, D = any>(url: string, config?: any): Promise<R>;
    post<T = any, R = T, D = any>(url: string, data?: any, config?: any): Promise<R>;
    put<T = any, R = T, D = any>(url: string, data?: any, config?: any): Promise<R>;
    patch<T = any, R = T, D = any>(url: string, data?: any, config?: any): Promise<R>;
    delete<T = any, R = T, D = any>(url: string, config?: any): Promise<R>;
};

export default api as unknown as CustomizedAxios;