import {Link, Navigate, Outlet, useLocation} from "react-router";
import logoSvg from "@/assets/style_hub_logo.svg";
import {useAuthStore} from "@/store/useAuthStore";

export function AuthLayout() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    // 1. 스토어에서 로딩 상태도 함께 가져옵니다.
    const isLoading = useAuthStore((state) => state.isLoading);

    // 2. [추가] 서버 인증 확인 중이거나 스토어 초기화 중일 때는 판단을 보류하고 로딩 처리
    if (isLoading) {
        return null; // 또는 로딩 스피너 컴포넌트 (e.g. <LoadingSpinner />)
    }

    // 이미 로그인된 상태라면 메인 페이지('/')로 리다이렉트
    if (isAuthenticated) {
        return <Navigate to="/" replace/>;
    }

    const location = useLocation();
    const isLoginPage = location.pathname === "/auth";
    const maxWidth = isLoginPage ? "max-w-[750px]" : "max-w-[450px]";

    return (
        <div className="max-w-[1280px] mx-auto px-4 py-12">
            <div className={`${maxWidth} mx-auto transition-all`}>
                {/* Logo */}
                <div className="text-center">
                    <Link to="/auth" className="inline-block">
                        <img
                            src={logoSvg}
                            alt="StyleHub 로고"
                            className="h-33 w-auto object-contain mx-auto"
                        />
                    </Link>
                </div>
                <div className="bg-white border border-border rounded-xl p-8">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}