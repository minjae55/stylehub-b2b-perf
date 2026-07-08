import React, {useRef, useState} from "react";
import {Link, useNavigate} from "react-router";
import {Eye, EyeOff, ShoppingBag, TrendingUp, Users} from "lucide-react";
import {useAuthStore} from "@/store/useAuthStore";
import {getMe} from "@/api/user/user.service";
import {login} from "@/api/auth/auth.service";
import btn_apple from "@/assets/btn_apple.png";
import btn_kakao from "@/assets/btn_kakao.png";
import btn_naver from "@/assets/btn_naver.png";

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

    //  비밀번호 인풋창을 직접 제어하기 위한 ref 생성
    const emailInputRef = useRef<HTMLInputElement>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);

    const navigate = useNavigate();
    const setUser = useAuthStore((state) => state.setUser);

    // 아무것도 입력하지 않았을 때 버튼을 회색으로 만들기 위한 체크 변수
    const isFormEmpty = !form.email.trim() || !form.password.trim();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value, type, checked} = e.target;

        // name이 form의 key 중 하나임을 TypeScript에게 명확히 알려줍니다.
        const fieldName = name as keyof typeof form;
        const fieldValue = type === "checkbox" ? checked : value;

        setForm((prev) => ({
            ...prev,
            [fieldName]: fieldValue,
        }));
    };

    const handleLogin = async (e: React.SubmitEvent) => {
        e.preventDefault();
        setError(null);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
            setError("올바른 이메일 형식을 입력해 주세요.");
            emailInputRef.current?.focus();
            return;
        }

        // 아예 둘다 비어있을 때 버튼을 누른 경우
        if ((!form.email.trim() && !form.password.trim())) {
            setError("이메일과 비밀번호를 입력해주세요.");
            emailInputRef.current?.focus();
            return;
        }

        // 이메일이 비어있을 때
        if (!form.email.trim()) {
            setError("이메일을 입력해주세요.");
            emailInputRef.current?.focus();
            return;
        }

        // 이메일은 있는데 비밀번호가 비어있을 때
        if (!form.password.trim()) {
            setError("비밀번호를 입력해주세요.");
            passwordInputRef.current?.focus();
            return;
        }

        setLoading(true);
        try {
            await login({email: form.email, password: form.password, rememberMe: form.remember});
            const user = await getMe();
            setUser(user);

            if (user.role === "ADMIN") {
                window.location.href = "/admin";
            } else if (user.businessRole === "SELLER") {
                window.location.href = "/seller";
            } else {
                window.location.href = "/";
            }
        } catch (err: any) {
            const responseData = err.response?.data;
            if (responseData?.code === "COMMON_001" && responseData?.data) {
                const errorDetail = responseData.data;
                const firstErrorKey = Object.keys(errorDetail)[0];
                setError(errorDetail[firstErrorKey]);
            } else {
                setError(responseData?.message ?? "로그인에 실패했습니다.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-h-[750px] flex flex-col lg:flex-row overflow-hidden">

            {/* ── Left: Branding panel ── */}
            <div className="hidden lg:flex lg:w-[44%] bg-[#0c0c0c] flex-col relative overflow-hidden select-none">
                <div
                    className="absolute inset-0 opacity-[0.035]"
                    style={{backgroundImage: "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 0,transparent 60px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 0,transparent 60px)"}}
                />
                <div className="absolute left-0 top-0 w-[3px] h-full bg-primary"/>
                <div
                    className="absolute bottom-[-20px] right-[-10px] text-[160px] font-black leading-none pointer-events-none"
                    style={{color: "rgba(255,255,255,0.025)", fontStyle: "italic"}}
                    aria-hidden
                >
                    B2B
                </div>

                <div className="relative z-10 flex flex-col h-full px-10 py-8">
                    <div className="flex-1 flex flex-col justify-center gap-5">
                        <div>
                            <p className="text-primary text-xs tracking-[0.2em] uppercase font-semibold mb-3">
                                — 패션 B2B Platform
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

            {/* ── Right: Form panel ── */}
            <div className="flex-1 flex flex-col bg-white overflow-y-auto">
                <div className="lg:hidden flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
                    <div className="text-xl font-bold">
                        Style<span className="text-primary">Hub</span>
                    </div>
                    <Link to="/auth/register" className="text-sm text-primary font-semibold">
                        회원가입
                    </Link>
                </div>

                <div className="flex-1 flex items-center justify-center px-8 py-8">
                    <form onSubmit={handleLogin} className="w-full max-w-[360px]">
                        <div className="mb-6">
                            <h3 className="text-1xl font-bold text-foreground mb-2">사장님! 다른 플랫폼에서 방황하지 마세요.</h3>
                            <p className="text-sm text-muted-foreground">도매상품을 스타일 허브에서 만나보세요!</p>
                        </div>

                        <div className="space-y-4">
                            <input
                                ref={emailInputRef}
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="이메일"
                                className="w-full border border-border rounded-lg px-4 py-3 text-sm outline-none focus:border-primary transition-colors bg-white"
                            />
                            <div className="relative">
                                <input
                                    ref={passwordInputRef}
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
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
                            {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
                        </div>

                        <div className="flex items-center justify-between mt-4">
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
                                <input
                                    type="checkbox"
                                    checked={form.remember}
                                    onChange={(e) => setForm({...form, remember: e.target.checked})}
                                    className="rounded"
                                />
                                로그인 상태 유지
                            </label>
                            <div className="flex items-center gap-1">
                                <Link to="/auth/find-id" className="text-xs text-primary hover:underline">아이디 찾기</Link>
                                <span className="text-xs">/</span>
                                <Link to="/auth/find-pw" className="text-xs text-primary hover:underline">비밀번호 찾기</Link>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full disabled:opacity-50 text-white py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 mt-4
                            ${isFormEmpty
                                ? "bg-gray-300 cursor-pointer"
                                : "bg-primary hover:bg-primary/90 cursor-pointer"
                            }`}
                        >
                            {loading ? "로그인 중..." : "로그인"}
                        </button>

                        <div className="mt-6 pt-5 border-t border-border">
                            <p className="text-center text-sm text-muted-foreground mb-3">아직 계정이 없으신가요?</p>
                            <Link
                                to="/auth/register"
                                className="block border border-gray-300 text-gray-600 text-sm font-medium py-2.5 rounded-lg text-center hover:border-primary hover:text-primary transition-all"
                            >
                                회원 가입
                            </Link>
                        </div>

                        <div className="flex justify-center gap-4 mt-4">
                            <Link to="https://nid.naver.com/nidlogin.login?mode=form&url=https://www.naver.com/"
                                  title="네이버로그인">
                                <img src={btn_naver} alt="네이버로그인" width="48" height="48"/>
                            </Link>
                            <Link
                                to="https://accounts.kakao.com/login/simple/?continue=https%3A%2F%2Fcs.kakao.com%2F&talk_login=#simpleLogin"
                                title="카카오로그인">
                                <img src={btn_kakao} alt="카카오로그인" width="48" height="48"/>
                            </Link>
                            <Link to="https://account.apple.com/sign-in" title="애플로그인">
                                <img src={btn_apple} alt="애플로그인" width="48" height="48"/>
                            </Link>

                        </div>
                    </form>
                </div>

                <div className="px-6 py-4 border-t border-border text-center mt-auto">
                    <p className="text-xs text-muted-foreground">
                        © 2026 StyleHub. All rights reserved. ·{" "}
                        <a href="#" className="hover:text-foreground transition-colors">이용약관</a>
                        {" · "}
                        <a href="#" className="hover:text-foreground transition-colors">개인정보처리방침</a>
                    </p>
                </div>
            </div>
        </div>
    );
}