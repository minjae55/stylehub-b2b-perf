import {Link, Outlet, useLocation} from "react-router";
import logoSvg from "@/assets/style_hub_logo.svg";

export function AuthLayout() {
    const location = useLocation();
    // 로그인 페이지인지 확인
    const isLoginPage = location.pathname === "/auth";

    // 로그인 페이지면 750px, 그 외(가입, 아이디찾기 등)는 480px
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