import { Link, Outlet } from "react-router";

export function AuthLayout() {
    return (
        <div className="max-w-[1280px] mx-auto px-4 py-12">
            <div className="max-w-[750px] mx-auto">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/auth/login" className="inline-block">
                        <div className="text-5xl font-bold">
                            <span className="text-primary">Style</span>
                            <span className="text-foreground">Hub</span>
                        </div>
                        <div className="text-xs text-muted-foreground tracking-widest uppercase mt-2">
                            국내 패션 B2B 도매 플랫폼
                        </div>
                    </Link>
                </div>
                <div className="bg-white border border-border rounded p-8">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}