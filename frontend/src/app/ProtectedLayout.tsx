import {Outlet, useMatches} from "react-router";
import {useAuthStore} from "@/store/useAuthStore";

interface RouteHandle {
    role?: string;
}

export function ProtectedLayout() {
    const {user, isLoading} = useAuthStore();
    const matches = useMatches();

    // 1. 앱 초기 구동 시 유저 세션을 검사하는 동안 스피너 표출
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
                로딩 중...
            </div>
        );
    }

    // 2. 비로그인 유저인 경우 무조건 로그인 페이지로 토스
    /* if (!user) {
         return <Navigate to="/auth/login" replace />;
     }

     // 3. 현재 진입하려는 라우트의 handle 객체에서 요구하는 권한(role) 추출
     // 하위 트리 경로를 순회하며 매칭되는 티켓이 있는지 찾습니다.
     const requiredRole = matches
         .map((m) => m.handle as RouteHandle)
         .find((handle) => handle?.role)?.role;

     // 4. 경로 자체에 특정 도메인 주소가 포함되어 있는지 검사 (예: admin)
     // 매칭된 라우트 배열 중 주소에 'admin'이 포함되어 있는지 판별합니다.
     const isAdminPath = matches.some((m) => m.pathname.split("/").includes("admin"));

     // 5. 역할 권한 가드 조건문 실행
     if (isAdminPath && user.role !== "ADMIN") {
         // 관리자가 아닌데 관리자 페이지에 접근했다면 메인 홈으로 축출
         return <Navigate to="/" replace />;
     }*/
    // 6. 모든 권한 장벽 통과 시 하위 컴포넌트 정상 표출
    return <Outlet/>;
}