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

// 401 응답(액세스 토큰 만료) 시 자동으로 리프레시 토큰으로 재발급 시도
api.interceptors.response.use(

    // 정상 응답은 그대로 반환
    (response) => response,

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
                // 리프레시 토큰도 만료 → 로그인 페이지로 이동
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;