import axios, {AxiosResponse} from "axios";
import {useAuthStore} from "@/store/useAuthStore";
import {ApiResponse, ErrorResponse} from "./types";

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
    // 백엔드가 ApiResponse<T> { success, data, message } 형태로 응답하면
    // 그 중 실제 데이터인 data.data만 꺼내서 반환
    // 덕분에 호출하는 쪽에서 const user = await api.get("/users/me") 처럼 바로 쓸 수 있음
    (response: AxiosResponse<ApiResponse<any>>) => {
        return response.data.data;
    },

    // ── 에러 응답 처리 ──────────────────────
    async (error) => {
        const originalRequest = error.config;
        const url = originalRequest.url || "";

        // /auth/ 경로 요청 (로그인, 회원가입, 토큰 재발급 등)은 인터셉터 처리 제외
        // 이 요청들이 401이 나도 재발급 시도하면 무한루프 위험이 있어서 그냥 패스
        const isAuthRequest = url.includes("/auth/");
        if (isAuthRequest) {
            return Promise.reject(error);
        }

        // 액세스 토큰 만료(401) 시 리프레시 토큰으로 자동 갱신 시도
        // _retry 플래그로 재시도를 1번으로 제한 (무한루프 방지)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // ⚠️ api 인스턴스가 아닌 axios 원본으로 호출
                // api 인스턴스로 호출하면 이 인터셉터를 또 타게 되어 무한루프 위험
                // 리프레시 토큰은 쿠키에 있어서 body 없이 요청만 보내면 됨
                await axios.post("/api/auth/refresh", {}, { withCredentials: true });

                // 재발급 성공 → 실패했던 원래 요청 자동 재시도
                // 새 accessToken은 이미 쿠키로 갱신되어 있어서 별도 헤더 설정 불필요
                return api(originalRequest);

            } catch (refreshError) {
                // 리프레시 토큰마저 만료된 상황
                // zustand store의 user 정보만 초기화
                // 화면 이동은 ProtectedLayout이 user === null을 감지해서 처리
                useAuthStore.getState().clearUser();
                return Promise.reject(refreshError);
            }
        }

        // 백엔드가 보낸 커스텀 에러 메시지로 교체
        // 이렇게 하면 catch(err)에서 err.message로 바로 한국어 메시지를 꺼낼 수 있음
        // 예: "이미 사용 중인 이메일입니다.", "비밀번호가 올바르지 않습니다." 등
        if (error.response?.data) {
            const serverError = error.response.data as ErrorResponse;
            if (serverError.message) {
                error.message = serverError.message;
            }
        } else if (!error.response) {
            // 서버 자체에 연결이 안 되는 경우 (Spring 서버가 꺼져있을 때 등)
            error.message = "서버와 연결할 수 없습니다. 서버 구동 상태를 확인하세요.";
        }

        return Promise.reject(error);
    }
);

// ───────────────────────────────────────────
// 커스텀 타입 정의
// ───────────────────────────────────────────
// 기본 axios의 반환 타입은 AxiosResponse<T>인데,
// 위 인터셉터에서 response.data.data를 꺼내서 반환하도록 바꿨기 때문에
// 실제로는 T 자체가 반환됨
// 이 타입을 선언해두면 api.get<User>("/users/me")처럼
// 반환값을 바로 User 타입으로 받을 수 있어서 타입 추론이 깔끔해짐
type CustomizedAxios = {
    get<T = any, R = T, D = any>(url: string, config?: any): Promise<R>;
    post<T = any, R = T, D = any>(url: string, data?: any, config?: any): Promise<R>;
    put<T = any, R = T, D = any>(url: string, data?: any, config?: any): Promise<R>;
    patch<T = any, R = T, D = any>(url: string, data?: any, config?: any): Promise<R>;
    delete<T = any, R = T, D = any>(url: string, config?: any): Promise<R>;
};

// CustomizedAxios 타입으로 캐스팅해서 내보냄
// 팀원들은 이걸 import해서 쓰면 됨
// import api from "@/api/axios";
export default api as unknown as CustomizedAxios;