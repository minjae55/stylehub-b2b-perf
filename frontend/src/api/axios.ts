// src/api/axios.ts
import axios from "axios";

// Axios 인스턴스 생성
const api = axios.create({
    baseURL: "/api",          // Vite proxy로 Spring Boot(8080)에 연결
    withCredentials: true,    // ⚠️ HttpOnly 쿠키 방식이라 필수
    headers: {
        "Content-Type": "application/json",
    },
});

// ───────────────────────────────────────────
// 응답 인터셉터
// ───────────────────────────────────────────

let isRedirecting = false;

// 401 응답(액세스 토큰 만료) 시 자동으로 리프레시 토큰으로 재발급 시도
api.interceptors.response.use(

    // 정상 응답은 그대로 반환
    (response) => {
        // 백엔드가 준 ApiResponse 객체 구조 { success, data, message, code }
        return response.data.data;
    },

    // 에러 응답 처리
    async (error) => {
        const originalRequest = error.config;

        // 액세스 토큰 만료 && 아직 재시도 안 한 요청만 처리
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;  // 무한 루프 방지 플래그

            try {
                // 리프레시 토큰은 쿠키에 있어서 body 없이 요청만 보내면 됨
                // (브라우저가 자동으로 쿠키 첨부)
                await axios.post("/api/auth/refresh", {}, { withCredentials: true });

                // 재발급 성공 → 원래 실패했던 요청 재시도
                // 새 accessToken은 이미 쿠키로 갱신되어 있어서 별도 헤더 설정 불필요
                return api(originalRequest);

            } catch (refreshError) {
                // 리프레시 토큰도 만료되었을 때 처리

                // 1. 이미 로그인 페이지에 있거나, 이미 튕기는 중(isRedirecting)이라면 뒤이은 요청들은 알림 없이 튕겨냅니다.
                if (window.location.pathname === "/auth/login" || isRedirecting) {
                    return Promise.reject(refreshError);
                }

                isRedirecting = true; // 플래그를 켜서 다른 요청들이 alert를 못 띄우게 막음
                alert("세션이 만료되었습니다. 다시 로그인해주세요.");

                // 2. SPA 환경이라면 주소를 새로고침하는 href 대신 라우터를 쓰는 게 베스트지만,
                // href를 유지할 경우 뒤의 요청이 에러를 전파하지 못하도록 흐름을 완전히 끊어줍니다.
                window.location.href = "/auth/login";

                return new Promise(() => {}); // 중요: pending 상태의 프로미스를 반환하여 뒤이은 JS 에러 전파를 차단
            }
        }
        // 토큰 재시도마저 실패했거나, 다른 비즈니스 에러(ex: 사업자 중복)인 경우 처리
        if (error.response) {
            const serverError = error.response.data; // 백엔드의 ApiResponse

            // 백엔드가 포맷팅해서 준 예쁜 에러 메시지("이미 등록된 사업자등록번호입니다.")가 있다면
            // 자바스크립트 기본 에러 메시지 대신 그걸 꽂아줍니다.
            if (serverError && serverError.message) {
                error.message = serverError.message;
            }
        } else {
            // 서버가 아예 꺼져있거나(ECONNREFUSED) 네트워크 대동맥이 끊긴 경우
            error.message = "서버와 연결할 수 없습니다. 서버 구동 상태를 확인하세요.";
        }
        return Promise.reject(error);
    }
);

type CustomizedAxios = {
    get<T = any, R = T, D = any>(url: string, config?: any): Promise<R>;
    post<T = any, R = T, D = any>(url: string, data?: any, config?: any): Promise<R>;
    put<T = any, R = T, D = any>(url: string, data?: any, config?: any): Promise<R>;
    patch<T = any, R = T, D = any>(url: string, data?: any, config?: any): Promise<R>;
    delete<T = any, R = T, D = any>(url: string, config?: any): Promise<R>;
};

export default api as unknown as CustomizedAxios;
