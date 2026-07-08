import {Link, Navigate, Outlet, useLocation} from "react-router";
import logoSvg from "@/assets/style_hub_logo.svg";
import {useAuthStore} from "@/store/useAuthStore";
import {useEffect} from "react";

export function AuthLayout() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);
    const isLoading = useAuthStore((state) => state.isLoading);
    const setLoading = useAuthStore((state) => state.setLoading);
    const location = useLocation();

    // ───────────────────────────────────────────
    // [추가] /auth 하위 페이지에 진입하면 전역 로딩 상태를 강제로 끕니다.
    // ───────────────────────────────────────────
    useEffect(() => {
        if (isLoading) {
            setLoading(false);
        }
    }, [isLoading, setLoading]);

    // 로딩 상태가 true인 동안만 잠깐 렌더링을 방류합니다. (위 Effect에 의해 즉시 false로 바뀜)
    if (isLoading) {
        return null;
    }

    // 이미 로그인된 상태라면 메인 페이지('/')로 리다이렉트
    if (isAuthenticated) {
        if (user?.role === "ADMIN") {
            return <Navigate to="/admin" replace/>;
        }
        if (user?.businessRole === "SELLER") {
            return <Navigate to="/seller" replace/>;
        }
        return <Navigate to="/" replace/>;
    }

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