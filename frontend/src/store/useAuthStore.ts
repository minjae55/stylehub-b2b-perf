import {create} from "zustand";
import {createJSONStorage, persist} from "zustand/middleware";
import type {UserResponse} from "@/api/auth/auth.types";

// ───────────────────────────────────────────
// 인증 전역 상태 (Auth Store)
// 로그인한 유저 정보를 앱 전체에서 공유
// localStorage에 persist되어 새로고침해도 유지됨
//
// 사용법
// import { useAuthStore } from "@/store/useAuthStore";
//
// function AnyComponent() {
//     const user = useAuthStore((state) => state.user);
//     return <div>{user?.name}님 안녕하세요</div>;
// }
// ───────────────────────────────────────────

interface AuthState {
    // ── 상태 ──────────────────────────────
    user: UserResponse | null;  // 로그인한 유저 정보 (비로그인 시 null)
    isLoading: boolean;         // 앱 첫 로드 시 서버 인증 확인 중인지 여부
    isAuthenticated: boolean;   // 로그인 여부 (user !== null과 동일하지만 명시적 플래그)

    // ── 액션 ──────────────────────────────
    setUser: (user: UserResponse) => void;                          // 로그인 성공 시 유저 정보 저장
    clearUser: () => void;                                          // 로그아웃 시 유저 정보 초기화
    setLoading: (loading: boolean) => void;                         // 로딩 상태 변경
    updateBusinessRole: (newRole: "BUYER" | "SELLER" | "BOTH") => void; // businessRole만 부분 업데이트
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            // ── 초기값 ──────────────────────────────
            user: null,
            isLoading: true,        // 앱 첫 진입 시 서버 검증 전까지 로딩 상태
            isAuthenticated: false,

            // 로그인 성공 또는 getMe() 성공 시 호출
            // user 저장 + 인증 완료 + 로딩 종료를 한 번에 처리
            setUser: (user) =>
                set({user, isAuthenticated: true, isLoading: false}),

            // 로그아웃 또는 토큰 만료 시 호출
            // user 초기화 + 비인증 상태 + 로딩 종료를 한 번에 처리
            clearUser: () =>
                set({user: null, isAuthenticated: false, isLoading: false}),

            // ProtectedLayout에서 서버 검증 완료 후 로딩 종료 시 사용
            setLoading: (loading) =>
                set({isLoading: loading}),

            // BUYER ↔ SELLER ↔ BOTH 전환 시 user 전체를 교체하지 않고 role만 부분 업데이트
            // 예: 마이페이지에서 역할 변경 후 store 갱신
            updateBusinessRole: (newRole) =>
                set((state) => ({
                    user: state.user ? {...state.user, businessRole: newRole} : null
                })),
        }),
        {
            // localStorage에 저장될 키 이름
            // ProtectedLayout의 localStorage.getItem("auth-storage")와 반드시 일치해야 함
            name: "auth-storage",

            // 스토리지 엔진 명시 (기본값도 localStorage지만 명시적으로 선언)
            // sessionStorage로 바꾸면 탭 닫을 때 자동 초기화됨
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);