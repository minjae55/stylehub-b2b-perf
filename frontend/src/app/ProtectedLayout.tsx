import {Navigate, Outlet} from "react-router";
import {useAuthStore} from "@/store/useAuthStore";

// auth를 제외한 모든 페이지를 감싸는 인증 가드
// 비로그인 상태면 로그인 페이지로 리다이렉트
export function ProtectedLayout() {
    const {user, isLoading} = useAuthStore();

    // App.tsx에서 이미 isLoading 처리하지만, 안전장치로 한 번 더 체크
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
                로딩 중...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth/login" replace/>;
    }

    return <Outlet/>;
}