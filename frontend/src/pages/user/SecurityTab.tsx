import {useState} from "react";
import {AlertCircle, CheckCircle, Eye, EyeOff, Link, ShieldCheck, Unlink} from "lucide-react";
import {useAuthStore} from "@/store/useAuthStore";
import {changePassword} from "@/api/user/user.service";
import {useNavigate} from "react-router";
import {logout} from "@/api/auth/auth.service";
import {PasswordStrengthBar} from "@/pages/auth/register/shared";

// ── Types ─────────────────────────────────────────────────────────────────────

type SocialProvider = "NAVER" | "KAKAO" | "GOOGLE";

interface SocialAccount {
    provider: SocialProvider;
    providerUid: string | null;   // null = 연동 안 됨
    connectedAt: string | null;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const INITIAL_SOCIALS: SocialAccount[] = [
    { provider: "NAVER",  providerUid: "naver_uid_xxxxx", connectedAt: "2024.01.15" },
    { provider: "KAKAO",  providerUid: null,               connectedAt: null },
    { provider: "GOOGLE", providerUid: null,               connectedAt: null },
];

// ── Provider meta ─────────────────────────────────────────────────────────────

const PROVIDER_META: Record<SocialProvider, {
    label: string; color: string; bg: string; border: string; icon: string;
}> = {
    NAVER:  {
        label: "네이버",  icon: "N",
        color: "text-[#03C75A]", bg: "bg-[#03C75A]/10", border: "border-[#03C75A]/30",
    },
    KAKAO:  {
        label: "카카오",  icon: "K",
        color: "text-[#3A1D1D]", bg: "bg-[#FEE500]/40", border: "border-[#FEE500]",
    },
    GOOGLE: {
        label: "구글",    icon: "G",
        color: "text-[#4285F4]", bg: "bg-[#4285F4]/10", border: "border-[#4285F4]/30",
    },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls =
    "w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors";

function SectionHeader({ icon, title, desc }: {
    icon: React.ReactNode; title: string; desc?: string;
}) {
    return (
        <div className="mb-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                <span className="text-primary">{icon}</span>
                {title}
            </h2>
            {desc && <p className="text-xs text-muted-foreground mt-1">{desc}</p>}
        </div>
    );
}

// ── Password Section ──────────────────────────────────────────────────────────
const PasswordField = ({
                           label, value, onChange, placeholder, show, onToggle, mismatch,
                       }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    field: string;
    placeholder?: string;
    show: boolean;
    onToggle: () => void;
    mismatch?: boolean;
}) => (
    <div>
        <label className="block text-sm font-medium text-[#333] mb-1.5">{label}</label>
        <div className="relative">
            <input
                type={show ? "text" : "password"}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`${inputCls} pr-10 ${mismatch ? "border-red-400" : ""}`}
            />
            <button
                type="button"
                onClick={onToggle}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
                {show ? <EyeOff size={15}/> : <Eye size={15}/>}
            </button>
        </div>
        {mismatch && (
            <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>
        )}
    </div>
);

function PasswordSection() {
    const [current, setCurrent]   = useState("");
    const [next, setNext]         = useState("");
    const [confirm, setConfirm]   = useState("");
    const [show, setShow]         = useState({ current: false, next: false, confirm: false });
    const [saving, setSaving]     = useState(false);
    const [error, setError]       = useState<string | null>(null);
    const [success, setSuccess]   = useState(false);

    const clearUser = useAuthStore((state) => state.clearUser);
    const navigate = useNavigate();

    const validate = (): string | null => {
        if (!current) return "현재 비밀번호를 입력해 주세요.";
        if (next.length < 8) return "새 비밀번호는 8자 이상이어야 합니다.";
        if (next === current) return "새 비밀번호는 현재 비밀번호와 다르게 설정해야 합니다."; // 👈 보안 검증 추가
        if (next !== confirm) return "새 비밀번호가 일치하지 않습니다.";
        if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(next)) {
            return "영문자, 숫자, 특수문자를 각각 최소 1자 이상 포함해야 합니다.";
        }
        return null;
    };

    const handleSubmit = async () => {
        const err = validate();
        if (err) { setError(err); return; }

        setError(null);
        setSaving(true);
        setSuccess(false);

        try {
            // 1. 비밀번호 변경 API 호출
            await changePassword(current, next);

            // 2. 성공 메시지 표시 및 입력창 비우기
            setSuccess(true);
            setCurrent(""); setNext(""); setConfirm("");

            // 3. 1.5초~2초 후 세션 정리 및 로그인 페이지로 이동
            // (사용자가 성공 메시지를 읽을 시간을 줍니다)
            setTimeout(async () => {
                try {
                    // 백엔드 로그아웃 API 호출 (/auth/logout)
                    await logout();
                } catch (logoutErr) {
                    // 로그아웃 API가 실패하더라도 프론트엔드 클리어는 진행되어야 안전합니다.
                    console.error("인증 서버 로그아웃 실패:", logoutErr);
                } finally {
                    // Zustand 스토어 초기화 및 localStorage 비우기
                    clearUser();
                    // 로컬스토리지에 저장된 토큰이 별도로 있다면 여기서 같이 삭제
                    localStorage.removeItem("accessToken");

                    // 로그인 화면으로 리다이렉트
                    navigate("/login");
                }
            }, 2000);

        } catch (e: any) {
            setError(e.message || "비밀번호 변경 중 오류가 발생했습니다.");
        } finally {
            setSaving(false);
        }
    };

    const toggle = (field: keyof typeof show) =>
        setShow((s) => ({ ...s, [field]: !s[field] }));

    const isPasswordValid =
        next.length >= 8 &&
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(next);

    const pwMismatch = !!confirm && next !== confirm;

    return (
        <section>
            <SectionHeader
                icon={<ShieldCheck size={16} />}
                title="비밀번호 변경"
                desc="주기적인 비밀번호 변경으로 계정을 안전하게 보호하세요."
            />

            <div className="space-y-4 max-w-sm">
                <PasswordField
                    label="현재 비밀번호"
                    value={current}
                    onChange={setCurrent}
                    field="current"
                    show={show.current}
                    onToggle={() => toggle("current")}
                />
                <PasswordField
                    label="새 비밀번호"
                    value={next}
                    onChange={setNext}
                    field="next"
                    show={show.next}
                    onToggle={() => toggle("next")}
                />
                <PasswordStrengthBar password={next}/>
                {next && !isPasswordValid && (
                    <p className="text-xs text-amber-600 mt-1">
                        영문자, 숫자, 특수문자(@$!%*#?&)를 각각 최소 1자 이상 포함해야 합니다.
                    </p>
                )}
                <PasswordField
                    label="새 비밀번호 확인"
                    value={confirm}
                    onChange={setConfirm}
                    field="confirm"
                    show={show.confirm}
                    onToggle={() => toggle("confirm")}
                    mismatch={pwMismatch}
                />

                {error && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                        <AlertCircle size={13} className="shrink-0" /> {error}
                    </div>
                )}
                {success && (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
                        <CheckCircle size={13} className="shrink-0" /> 비밀번호가 변경되었습니다.
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={saving || !current || !isPasswordValid || !confirm || pwMismatch}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                    {saving ? (
                        <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />변경 중...</>
                    ) : "비밀번호 변경"}
                </button>
            </div>
        </section>
    );
}

// ── Social Section ────────────────────────────────────────────────────────────

function SocialSection() {
    const [accounts, setAccounts] = useState<SocialAccount[]>(INITIAL_SOCIALS);
    const [loading, setLoading]   = useState<SocialProvider | null>(null);

    const handle = (provider: SocialProvider, isConnected: boolean) => {
        setLoading(provider);
        // TODO: redirect to OAuth / DELETE /social-accounts/:provider
        setTimeout(() => {
            setAccounts((prev) =>
                prev.map((a) =>
                    a.provider === provider
                        ? isConnected
                            ? { ...a, providerUid: null, connectedAt: null }
                            : { ...a, providerUid: `${provider.toLowerCase()}_uid_demo`, connectedAt: new Date().toLocaleDateString("ko-KR").replace(/\. /g, ".").replace(/\.$/, "") }
                        : a,
                ),
            );
            setLoading(null);
        }, 900);
    };

    return (
        <section className="pt-6 border-t border-border">
            <SectionHeader
                icon={<Link size={16} />}
                title="소셜 계정 연동"
                desc="소셜 계정으로 빠르게 로그인할 수 있습니다."
            />

            <div className="space-y-3">
                {accounts.map((acc) => {
                    const m           = PROVIDER_META[acc.provider];
                    const isConnected = acc.providerUid !== null;
                    const isLoading   = loading === acc.provider;

                    return (
                        <div
                            key={acc.provider}
                            className="flex items-center justify-between border border-border rounded-lg px-4 py-3.5"
                        >
                            {/* Left */}
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-full ${m.bg} ${m.border} border flex items-center justify-center font-black text-sm ${m.color}`}>
                                    {m.icon}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{m.label}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {isConnected ? `연동일: ${acc.connectedAt}` : "연동되지 않음"}
                                    </p>
                                </div>
                            </div>

                            {/* Right */}
                            <div className="flex items-center gap-2">
                                {isConnected && (
                                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    연동됨
                  </span>
                                )}
                                <button
                                    onClick={() => handle(acc.provider, isConnected)}
                                    disabled={isLoading}
                                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                                        isConnected
                                            ? "border-red-200 text-red-600 hover:bg-red-50"
                                            : "border-primary/30 text-primary hover:bg-primary/5"
                                    } disabled:opacity-50`}
                                >
                                    {isLoading ? (
                                        <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                    ) : isConnected ? (
                                        <><Unlink size={12} />연동 해제</>
                                    ) : (
                                        <><Link size={12} />연동하기</>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                <AlertCircle size={11} className="shrink-0" />
                소셜 연동 해제 후에도 해당 계정의 데이터는 유지됩니다.
            </p>
        </section>
    );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export function SecurityTab() {
    return (
        <div className="space-y-0">
            <PasswordSection />
            <SocialSection />
        </div>
    );
}