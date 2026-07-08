import axios, {AxiosError} from "axios";
import {useAuthStore} from "@/store/useAuthStore";
import {ErrorResponse} from "./types";

/* ─────────────────────────────
   Base API Instance
   - 일반 API 요청용 axios 인스턴스
   - 모든 서비스에서 공통으로 사용
───────────────────────────── */
const api = axios.create({
    baseURL: "/api",
    withCredentials: true, // HttpOnly Cookie(JWT) 사용 시 필수
    headers: {"Content-Type": "application/json"},
});

/* ─────────────────────────────
   Refresh 전용 API Instance
   - interceptor 영향을 받지 않도록 별도 분리
   - accessToken 만료 시 refresh 요청 전용
───────────────────────────── */
const refreshApi = axios.create({
    baseURL: "/api",
    withCredentials: true,
});

/* ─────────────────────────────
   Refresh Lock (중복 요청 방지)
   - 여러 요청이 동시에 401 발생 시 refresh 1번만 수행
   - 나머지는 해당 Promise를 공유하여 대기
───────────────────────────── */
let refreshPromise: Promise<any> | null = null;

/* ─────────────────────────────
   Response Interceptor
   - 모든 API 응답/에러를 중앙에서 처리
───────────────────────────── */
api.interceptors.response.use(
    /**
     * [SUCCESS]
     * 백엔드 응답 구조: ApiResponse<T>
     * 실제 데이터만 추출해서 반환
     */
    (res) => res.data.data,

    /**
     * [ERROR HANDLING]
     * 1. 401 → access token 만료 처리
     * 2. refresh 성공 시 원 요청 재시도
     * 3. 일반 에러는 message 표준화
     */
    async (error: AxiosError) => {
        const {config, response} = error;
        const status = response?.status;

        // 요청 정보가 없으면 그대로 에러 반환
        if (!config) return Promise.reject(error);

        const PUBLIC_ENDPOINTS = [
            "/auth",
            "/ws",
            "/login",
            "/oauth2",
            "/error",
            "/upload/image",
            "/company/ocr",
            "/company/verify",
            "/company/lookup",
            "/users/signup",
            "/categories/main"
        ];

        // 요청 API URL에 인증 예외 주소가 포함되어 있는지 확인
        const isAuthEndpoint = PUBLIC_ENDPOINTS.some(path => config.url?.includes(path));

        // 현재 브라우저의 실제 주소창 위치가 /auth로 시작하는지 확인
        const isCurrentlyOnAuthPage = window.location.pathname.startsWith("/auth");

        /* ─────────────────────────────
           401 Unauthorized 처리
           - Access Token 만료 상황
           - 현재 /auth 페이지에 있거나 인증 예외 API 주소라면 refresh를 시도하지 않음
        ───────────────────────────── */
        if (status === 401 && !(config as any)._retry && !isAuthEndpoint && !isCurrentlyOnAuthPage) {
            (config as any)._retry = true; // 무한 retry 방지

            /**
             * 이미 refresh 진행 중이면
             * 기존 refreshPromise를 공유하여 대기
             */
            if (!refreshPromise) {
                refreshPromise = refreshApi
                    .post("/auth/refresh")
                    .finally(() => {
                        // refresh 완료 후 lock 해제
                        refreshPromise = null;
                    });
            }

            try {
                // refresh 완료까지 대기
                await refreshPromise;

                // 성공 시 원래 요청 재시도
                return api(config);

            } catch (refreshError) {
                // refresh 실패 (refresh token 만료 등)
                useAuthStore.getState().clearUser();
                return Promise.reject(refreshError);
            }
        }

        /* ─────────────────────────────
           공통 에러 포맷 처리
           - 백엔드 ErrorResponse 표준화
        ───────────────────────────── */
        if (response?.data) {
            const serverError = response.data as ErrorResponse;

            // 프론트에서 바로 message 사용 가능하도록 변환
            error.message = serverError.message || "에러 발생";

            // 원본 에러 구조 보존 (디버깅용)
            response.data = serverError;
        } else {
            error.message = "서버와 연결할 수 없습니다.";
        }

        return Promise.reject(error);
    }
);

/* ─────────────────────────────
   Type Override (편의용)
   - api.get<T>() → 자동으로 T 추론되도록 설정
───────────────────────────── */
type CustomizedAxios = {
    get<T = any, R = T>(url: string, config?: any): Promise<R>;
    post<T = any, R = T>(url: string, data?: any, config?: any): Promise<R>;
    put<T = any, R = T>(url: string, data?: any, config?: any): Promise<R>;
    patch<T = any, R = T>(url: string, data?: any, config?: any): Promise<R>;
    delete<T = any, R = T>(url: string, config?: any): Promise<R>;
};

export default api as unknown as CustomizedAxios;