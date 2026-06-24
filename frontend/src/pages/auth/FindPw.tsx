import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, ArrowRight, CheckCircle, AlertTriangle } from "lucide-react";
import { requestFindPassword } from "@/api/auth";

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls =
    "w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors";

function isValidEmail(v: string) {
    return /\S+@\S+\.\S+/.test(v);
}

// ── Main Component ────────────────────────────────────────────────────────────

export function FindPw() {
    const [email, setEmail]         = useState("");
    const [name, setName]           = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [sending, setSending]     = useState(false);
    const [error, setError]         = useState("");

    const canSubmit = isValidEmail(email) && name.trim().length > 0;

    const handleSubmit = async () => {
        if (!canSubmit || sending) return;
        setError("");
        setSending(true);
        try {
            await requestFindPassword({ email: email.trim(), name: name.trim() });
            setSubmitted(true);
        } catch (e: any) {
            setError(e.message ?? "입력하신 정보와 일치하는 계정을 찾을 수 없습니다.");
        } finally {
            setSending(false);
        }
    };

    const handleReset = () => {
        setSubmitted(false);
        setEmail("");
        setName("");
        setError("");
    };

    return (
        <>
            <Link
                to="/auth/login"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mb-4"
            >
                <ArrowLeft size={12} />
                로그인으로 돌아가기
            </Link>

            <h2 className="text-xl font-bold text-foreground mb-2">비밀번호 찾기</h2>
            <p className="text-sm text-muted-foreground mb-6">
                가입 시 등록한 이메일과 이름으로 비밀번호를 재설정할 수 있습니다.
            </p>

            {submitted ? (
                <div className="text-center py-4 px-2">
                    <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={28} className="text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground mb-2">비밀번호 재설정 이메일 발송</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                        <strong className="text-foreground">{email}</strong>로<br />
                        비밀번호 재설정 링크를 발송했습니다.
                    </p>
                    <div className="flex gap-2 items-start bg-amber-50 border border-amber-200 rounded-xl p-3 text-left mb-4">
                        <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 leading-relaxed">
                            이메일이 도착하지 않으면 스팸 폴더를 확인하거나 재발송을 요청하세요.
                            <br />링크 유효시간은 <span className="font-semibold">30분</span>입니다.
                        </p>
                    </div>
                    <div className="flex justify-center">
                        <Link
                            to="/auth/login"
                            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                        >
                            로그인하기
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#333] mb-1.5">가입 이메일 (아이디)</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@company.com"
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#333] mb-1.5">이름</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="가입 시 등록한 이름"
                            className={inputCls}
                        />
                    </div>

                    {error && (
                        <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl p-3">
                            {error}
                        </p>
                    )}

                    <p className="text-xs text-muted-foreground bg-muted/40 rounded-xl p-3">
                        입력하신 이메일로 비밀번호 재설정 링크가 발송됩니다.
                    </p>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!canSubmit || sending}
                        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40 text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                        {sending ? (
                            <>
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                발송 중...
                            </>
                        ) : (
                            <>재설정 링크 발송 <ArrowRight size={16} /></>
                        )}
                    </button>
                </div>
            )}
        </>
    );
}