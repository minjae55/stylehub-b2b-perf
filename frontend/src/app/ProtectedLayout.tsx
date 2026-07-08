import {Navigate, Outlet, useMatches} from "react-router";
import {useAuthStore} from "@/store/useAuthStore";
import {useEffect} from "react";
import {getMe} from "@/api/user/user.service";

// ───────────────────────────────────────────
// 인증 보호 레이아웃
// auth/* 경로를 제외한 모든 페이지를 감싸는 인증 가드
// 로그인 여부 확인 → 권한 체크 → 페이지 렌더링 순서로 동작
// ───────────────────────────────────────────
export function ProtectedLayout() {
    const {user, isLoading, setLoading, setUser, clearUser} = useAuthStore();
    const matches = useMatches();

    // ───────────────────────────────────────────
    // Step 1. 로컬스토리지에서 로그인 흔적 확인 (동기)
    // zustand-persist가 저장한 isAuthenticated 값으로 빠르게 판단
    // 흔적이 없으면 getMe() 호출 없이 즉시 비로그인으로 처리
    // ───────────────────────────────────────────
    const storageStr = localStorage.getItem("auth-storage");
    let hasToken = false;

    if (storageStr) {
        try {
            const storageData = JSON.parse(storageStr);
            if (storageData?.state?.isAuthenticated) {
                hasToken = true;
            }
        } catch (e) {
            hasToken = false;
        }
    }

    // ───────────────────────────────────────────
    // Step 2. 서버에 실제 로그인 상태 검증 (비동기)
    // 로컬 흔적이 있을 때만 getMe()를 호출해서 쿠키(토큰) 유효성 확인
    // 성공 → user 정보 store에 저장
    // 실패 → 세션 만료로 판단하고 store 초기화
    // ───────────────────────────────────────────
    useEffect(() => {
        const initAuth = async () => {
            try {
                const me = await getMe();
                setUser(me);
            } catch (error) {
                // 흔적은 있는데 서버 검증 실패 → 토큰 만료 또는 강제 삭제
                if (hasToken) {
                    alert("세션이 만료되었습니다. 다시 로그인해주세요.");
                }
                clearUser();
            } finally {
                // 성공/실패 무관하게 로딩 종료 (무한 로딩 방지)
                setLoading(false);
            }
        };

        if (hasToken) {
            void initAuth();
        } else {
            // 흔적 자체가 없으면 getMe() 호출 없이 즉시 로딩 종료
            // 아래 !user 조건에서 로그인 페이지로 리다이렉트
            setLoading(false);
        }
    }, [hasToken, setUser, clearUser, setLoading]);

    // ───────────────────────────────────────────
    // Step 3. 화면 흐름 제어
    // ───────────────────────────────────────────

    // 서버 검증 완료 전까지 로딩 화면 유지
    if (isLoading) {
        return (
            <div
                className="h-screen w-screen flex items-center justify-center text-sm text-muted-foreground bg-white fixed inset-0 z-50">
                로딩 중...
            </div>
        );
    }

    // 비로그인 상태 → 로그인 페이지로 리다이렉트
    if (!user) {
        return <Navigate to="/auth" replace/>;
    }
    // ───────────────────────────────────────────
    // Step 4. 역할(role) 및 비즈니스 권한 기반 접근 제어
    // ───────────────────────────────────────────

    // 라우터 handle에 걸려있는 권한 배열 또는 단일 role 수집
    const requiredRoles = matches
        .map((m) => (m.handle as any)?.roles)
        .find((roles) => Array.isArray(roles) && roles.length > 0);

    const requiredRole = matches
        .map((m) => (m.handle as any)?.role)
        .find((role) => typeof role === "string" && role.trim() !== "");

    // 1. [어드민 전용 라우트 체크] 라우터가 오직 ADMIN만 요구하는 경우
    // handle: { role: "ADMIN" } 또는 handle: { roles: ["ADMIN"] } 설정 대응
    const isPageForAdminOnly = requiredRole === "ADMIN" || requiredRoles?.includes("ADMIN");

    if (isPageForAdminOnly) {
        if (user.role !== "ADMIN") {
            alert("접근 권한이 없는 페이지입니다.");
            return <Navigate to="/" replace/>;
        }
        return <Outlet/>;
    }
    const isPageForPresidentOnly = requiredRole === "PRESIDENT" || requiredRoles?.includes("PRESIDENT");

    if (isPageForPresidentOnly) {
        if (user.role !== "PRESIDENT") {
            alert("접근 권한이 없는 페이지입니다.");
            return <Navigate to="/" replace/>;
        }
        return <Outlet/>;
    }

    // 2. 최고 관리자(ADMIN)는 일반 비즈니스(BUYER/SELLER) 페이지를 무조건 프리패스
    if (user.role === "ADMIN") {
        return <Outlet />;
    }

    // 3. ADMIN이 아닌 일반 유저(PRESIDENT, EMPLOYEE 등)의 비즈니스 권한 체크
    const userBizRole = user.businessRole || "";

    // Case A: 라우터에 배열 형태 권한 설정이 있을 때 (예: roles: ["SELLER", "BOTH"])
    if (requiredRoles) {
        if (!requiredRoles.includes(userBizRole)) {
            alert("해당 기능에 대한 접근 권한이 없습니다.");
            return <Navigate to="/" replace />;
        }
    }
    // Case B: 라우터에 단일 문자열 권한 설정이 있을 때 (예: role: "SELLER")
    else if (requiredRole) {
        if (userBizRole !== requiredRole) {
            alert("해당 기능에 대한 접근 권한이 없습니다.");
            return <Navigate to="/" replace />;
        }
    }

    // 모든 검증 통과 → 실제 페이지 렌더링
    return <Outlet/>;
}