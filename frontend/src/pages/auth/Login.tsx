import {useState} from "react";
import {Link, useNavigate} from "react-router";
import {ArrowRight, Eye, EyeOff, ShoppingBag, TrendingUp, Users} from "lucide-react";
import {useAuthStore} from "@/store/useAuthStore";
import {getMe, login} from "@/api/auth";

const STATS = [
    {icon: <ShoppingBag size={16}/>, value: "2,400+", label: "입점 브랜드"},
    {icon: <Users size={16}/>, value: "18,000+", label: "등록 바이어"},
    {icon: <TrendingUp size={16}/>, value: "월 32억+", label: "거래 금액"},
];

const TAGS = ["여성 캐주얼", "남성 스트릿", "아우터", "데님", "스포츠웨어", "이너웨어", "키즈", "빈티지"];

export function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({email: "", password: "", remember: false});
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const setUser = useAuthStore((state) => state.setUser);

    // 로그인 처리 함수
    const handleLogin = async () => {
        setError(null);
        setLoading(true);

        try {
            // 1. 로그인 요청 → 서버가 쿠키로 토큰 발급
            await login({email: form.email, password: form.password});

            // 2. 로그인 성공했으니 내 정보 조회
            const user = await getMe();

            // 3. zustand store에 저장 → 다른 컴포넌트에서 꺼내 쓸 수 있음
            setUser(user);

            // 4. 페이지 이동
            navigate("/buyer");

        } catch (err: any) {
            const message = err.response?.data?.message ?? "로그인에 실패했습니다.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen overflow-hidden flex flex-col lg:flex-row">

            {/* ── Left: Branding panel ─────────────────────────── */}
            <div className="hidden lg:flex lg:w-[44%] bg-[#0c0c0c] flex-col relative overflow-hidden select-none">

                {/* Grid texture */}
                <div
                    className="absolute inset-0 opacity-[0.035]"
                    style={{backgroundImage: "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 0,transparent 60px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 0,transparent 60px)"}}
                />

                {/* Primary accent bar */}
                <div className="absolute left-0 top-0 w-[3px] h-full bg-primary"/>

                {/* Decorative oversized text */}
                <div
                    className="absolute bottom-[-20px] right-[-10px] text-[160px] font-black leading-none pointer-events-none"
                    style={{color: "rgba(255,255,255,0.025)", fontStyle: "italic"}}
                    aria-hidden
                >
                    B2B
                </div>

                <div className="relative z-10 flex flex-col h-full px-10 py-8">
                    {/* Logo */}

                    {/* Main copy */}
                    <div className="flex-1 flex flex-col justify-center gap-5">
                        <div>
                            <p className="text-primary text-xs tracking-[0.2em] uppercase font-semibold mb-3">
                                — Fashion B2B Platform
                            </p>
                            <h1 className="text-[44px] font-black text-white leading-[1.05] tracking-tight">
                                패션 B2B<br/>
                                <span className="text-primary italic">새로운</span><br/>
                                기준
                            </h1>
                        </div>

                        <p className="text-white/40 text-sm leading-relaxed max-w-[240px]">
                            검증된 브랜드와 전국 바이어를 연결하는 국내 최대 패션 도매 플랫폼입니다.
                        </p>

                        {/* Category tags */}
                        <div className="flex flex-wrap gap-1.5">
                            {TAGS.map((tag) => (
                                <span
                                    key={tag}
                                    className="text-[11px] text-white/40 border border-white/10 rounded-full px-2.5 py-1 hover:border-primary/50 hover:text-primary/70 transition-colors cursor-default"
                                >
                  {tag}
                </span>
                            ))}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="border-t border-white/10 pt-6 grid grid-cols-3 gap-4">
                        {STATS.map((s) => (
                            <div key={s.label}>
                                <div className="flex items-center gap-1.5 text-primary/60 mb-1">
                                    {s.icon}
                                </div>
                                <div className="text-lg font-bold text-white">{s.value}</div>
                                <div className="text-[11px] text-white/30 mt-0.5">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right: Form panel ──────────────────────────────── */}
            <div className="flex-1 flex flex-col bg-white h-screen overflow-y-auto">
                {/* Mobile logo */}
                <div className="lg:hidden flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
                    <div className="text-xl font-bold">
                        Style<span className="text-primary">Hub</span>
                    </div>
                    <Link to="/auth/register" className="text-sm text-primary font-semibold">
                        회원가입
                    </Link>
                </div>

                <div className="flex-1 flex items-center justify-center px-8 py-8">
                    <div className="w-full max-w-[360px]">

                        {/* Greeting */}
                        <div className="mb-6">
                            <h3 className="text-1xl font-bold text-foreground mb-2">사장님! 다른 플랫폼에서 방황하지 마세요.
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                도매상품을 스타일 허브에서 만나보세요!
                            </p>
                        </div>

                        {/* Form */}
                        <div className="space-y-4">
                            <div>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({...form, email: e.target.value})}
                                    placeholder="이메일"
                                    className="w-full border border-border rounded-lg px-4 py-3 text-sm outline-none focus:border-primary transition-colors bg-white"
                                />
                            </div>

                            <div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={form.password}
                                        onChange={(e) => setForm({...form, password: e.target.value})}
                                        placeholder="비밀번호 입력"
                                        className="w-full border border-border rounded-lg px-4 py-3 text-sm outline-none focus:border-primary transition-colors pr-11 bg-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                                    </button>
                                </div>
                                {/* 에러 메시지 표시 */}
                                {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
                            </div>

                            <div className="flex items-center justify-between">
                                {/* 좌측 */}
                                <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
                                    <input
                                        type="checkbox"
                                        checked={form.remember}
                                        onChange={(e) => setForm({...form, remember: e.target.checked})}
                                        className="rounded"
                                    />
                                    로그인 상태 유지
                                </label>

                                {/* 우측 그룹화 */}
                                <div className="flex items-center gap-1">
                                    <Link to="/auth/find-id" className="text-xs text-primary hover:underline">아이디
                                        찾기</Link>
                                    <span className="text-xs">/</span>
                                    <Link to="/auth/find-pw" className="text-xs text-primary hover:underline">비밀번호
                                        찾기</Link>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleLogin}
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 mt-2"
                            >
                                {loading ? "로그인 중..." : "로그인"} <ArrowRight size={15}/>
                            </button>
                        </div>

                        {/* Bottom CTA */}
                        <div className="mt-6 pt-5 border-t border-border">
                            <p className="text-center text-sm text-muted-foreground mb-3">
                                아직 계정이 없으신가요?
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                                <Link
                                    to="/auth/register"
                                    className="border border-gray-300 text-gray-600 text-sm font-medium py-2.5 rounded-lg text-center hover:border-primary hover:text-primary transition-all"
                                >
                                    회원 가입
                                </Link>
                            </div>
                        </div>
                        <div className="flex justify-center gap-4">
                            <div className="w-20 h-20 mt-6" id="lSnsLinkNaver"><Link
                                to="/ssl/member/snsLogin/mem_snsBridge.php?provider=naver&amp;back=aHR0cHM6Ly9kb21lbWVkYi5kb21lZ2dvb2suY29tL2luZGV4"
                                title="네이버로그인"><img src="https://cdn1.domeggook.com/image/member/btn_naver.png"
                                                    title="네이버로그인" alt="네이버로그인" width="48" height="48"/></Link></div>
                            <div className="w-20 h-20 mt-6" id="lSnsLinkKakao"><Link
                                to="/ssl/member/snsLogin/mem_snsBridge.php?provider=kakao&amp;back=aHR0cHM6Ly9kb21lbWVkYi5kb21lZ2dvb2suY29tL2luZGV4"
                                title="카카오로그인"><img src="https://cdn1.domeggook.com/image/member/btn_kakao.png"
                                                    title="카카오로그인" alt="카카오로그인" width="48" height="48"/></Link></div>
                            <div className="w-20 h-20 mt-6" id="lSnsLinkApple"><Link
                                to="/ssl/member/snsLogin/mem_snsBridge.php?provider=apple&amp;back=aHR0cHM6Ly9kb21lbWVkYi5kb21lZ2dvb2suY29tL2luZGV4"
                                title="애플로그인"><img src="https://cdn1.domeggook.com/image/member/btn_apple.png"
                                                   title="애플로그인" alt="애플로그인" width="48" height="48"/></Link></div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border text-center">
                    <p className="text-xs text-muted-foreground">
                        © 2025 StyleHub. All rights reserved. ·{" "}
                        <a href="#" className="hover:text-foreground transition-colors">이용약관</a>
                        {" · "}
                        <a href="#" className="hover:text-foreground transition-colors">개인정보처리방침</a>
                    </p>
                </div>
            </div>
        </div>
    );
}