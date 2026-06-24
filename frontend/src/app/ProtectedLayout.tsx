import {Navigate, Outlet, useMatches} from "react-router";
import {useAuthStore} from "@/store/useAuthStore";
import {useEffect} from "react";
import {getMe} from "@/api/user";

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
    // Step 4. 역할(role) 기반 접근 제어
    // 라우터의 handle: { role: "BUYER" | "SELLER" } 설정을 읽어서 권한 체크
    // ADMIN은 모든 경로 접근 허용
    // ───────────────────────────────────────────
    if (user.role !== "ADMIN") {

        // 안전 조치: 하위/상위 매칭된 모든 라우트를 순회하며 handle에 걸려있는 권한 정보 수집
        const activeRoles = matches
            .map((m) => (m.handle as any)?.roles)
            .find((roles) => Array.isArray(roles) && roles.length > 0);

        const activeRole = matches
            .map((m) => (m.handle as any)?.role)
            .find((role) => typeof role === "string" && role.trim() !== "");

        // 현재 유저의 비즈니스 역할 권한 범위 (안전하게 fallback 처리)
        const userBizRole = user.businessRole || "";

        // 1) 배열 형태 권한 설정(roles: ["SELLER", "BOTH"])이 상위/하위 라우트 중 하나라도 발견된 경우
        if (activeRoles) {
            if (!activeRoles.includes(userBizRole)) {
                alert("접근 권한이 없습니다.");
                return <Navigate to="/" replace />;
            }
        }

        // 2) 단일 문자열 형태 권한 설정(role: "SELLER")만 발견된 경우 (기존 코드 하위 호환)
        else if (activeRole) {
            if (userBizRole !== activeRole) {
                alert("접근 권한이 없습니다.");
                return <Navigate to="/" replace />;
            }
        }
    }

    // 모든 검증 통과 → 실제 페이지 렌더링
    return <Outlet/>;
}