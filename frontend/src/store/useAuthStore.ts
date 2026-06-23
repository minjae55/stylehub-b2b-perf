import {create} from "zustand";
import {createJSONStorage, persist} from "zustand/middleware";
import type {UserResponse} from "@/api/auth.types";

/*
사용법

import { useAuthStore } from "@/store/useAuthStore";

function AnyComponent() {
    const user = useAuthStore((state) => state.user);

    return <div>{user?.name}님 안녕하세요</div>;
}

*/

interface AuthState {
    user: UserResponse | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    setUser: (user: UserResponse) => void;
    clearUser: () => void;
    setLoading: (loading: boolean) => void;
    updateBusinessRole: (newRole: "BUYER" | "SELLER" | "BOTH") => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isLoading: true,
            isAuthenticated: false,

            // 로그인 성공 / 내 정보 조회 성공 시 호출
            setUser: (user) =>
                set({user, isAuthenticated: true, isLoading: false}),

            // 로그아웃 시 호출
            clearUser: () =>
                set({user: null, isAuthenticated: false, isLoading: false}),

            setLoading: (loading) =>
                set({isLoading: loading}),

            updateBusinessRole: (newRole) =>
                set((state) => ({
                    user: state.user ? {...state.user, businessRole: newRole} : null
                })),
        }),
        {
            name: "auth-storage", // 로컬스토리지에 저장될 키 이름
            storage: createJSONStorage(() => localStorage), // 👈 3. 안전하게 스토리지 엔진 명시 (기본값이 localStorage)
        }
    )
);