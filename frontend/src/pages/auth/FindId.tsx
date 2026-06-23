import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle,
    ShieldCheck,
    RotateCcw,
} from "lucide-react";
import { sendFindIdOtp, verifyFindIdOtp } from "@/api/auth";

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls =
    "w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors";

function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

function digitsOnly(v: string) {
    return v.replace(/\D/g, "");
}

// ── Main Component ────────────────────────────────────────────────────────────

export function FindId() {
    const [name, setName]             = useState("");
    const [phone, setPhone]           = useState("");
    const [code, setCode]             = useState("");

    const [otpSent, setOtpSent]       = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifying, setVerifying]   = useState(false);
    const [timer, setTimer]           = useState(180); // 3:00
    const [error, setError]           = useState("");
    const [step, setStep]             = useState<"form" | "result">("form");

    // 인증 성공 시 백엔드가 내려주는 결과
    const [result, setResult] = useState<{ maskedEmail: string; createdAt: string } | null>(null);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const phoneDigits = digitsOnly(phone);
    const phoneValid  = phoneDigits.length >= 10;
    const canSendOtp  = name.trim().length > 0 && phoneValid && !sendingOtp;
    const canVerify   = code.length === 6 && !verifying && timer > 0;

    useEffect(() => {
        if (!otpSent) return;
        intervalRef.current = setInterval(() => {
            setTimer((t) => {
                if (t <= 1) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [otpSent]);

    const handlePhoneChange = (v: string) => {
        setPhone(v);
        // 번호를 수정하면 기존 인증 상태를 초기화
        if (otpSent) {
            setOtpSent(false);
            setCode("");
            setError("");
        }
    };

    const handleSendOtp = async () => {
        if (!canSendOtp) return;
        setError("");
        setSendingOtp(true);
        try {
            await sendFindIdOtp({ name: name.trim(), phone: phoneDigits });
            setOtpSent(true);
            setCode("");
            setTimer(180);
        } catch (e: any) {
            setError(e.message ?? "인증번호 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        } finally {
            setSendingOtp(false);
        }
    };

    const handleResend = async () => {
        setCode("");
        setError("");
        setSendingOtp(true);
        try {
            await sendFindIdOtp({ name: name.trim(), phone: phoneDigits });
            setTimer(180);
        } catch (e: any) {
            setError(e.message ?? "인증번호 재전송에 실패했습니다.");
        } finally {
            setSendingOtp(false);
        }
    };

    const handleVerify = async () => {
        if (!canVerify) return;
        setError("");
        setVerifying(true);
        try {
            const res = await verifyFindIdOtp({ name: name.trim(), phone: phoneDigits, code });
            setResult(res);
            setStep("result");
        } catch (e: any) {
            setError(e.message ?? "인증번호가 일치하지 않습니다. 다시 확인해 주세요.");
        } finally {
            setVerifying(false);
        }
    };

    const handleReset = () => {
        setStep("form");
        setName("");
        setPhone("");
        setCode("");
        setOtpSent(false);
        setError("");
        setTimer(180);
        setResult(null);
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

            <h2 className="text-xl font-bold text-foreground mb-2">아이디 찾기</h2>
            <p className="text-sm text-muted-foreground mb-6">
                가입 시 등록한 이름과 휴대폰 번호로 아이디를 찾을 수 있습니다.
            </p>

            {step === "result" && result ? (
                /* ── 결과 ── */
                <div className="text-center py-4 px-2">
                    <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={28} className="text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground mb-2">본인 인증이 완료되었습니다</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                        입력하신 정보와 일치하는 계정을 찾았습니다.
                    </p>
                    <div className="bg-secondary border border-primary/20 rounded-xl p-4 mb-4 text-left">
                        <div className="text-xs text-muted-foreground mb-1">등록된 이메일 (아이디)</div>
                        <div className="font-mono font-semibold text-foreground">{result.maskedEmail}</div>
                        <div className="text-xs text-muted-foreground mt-2">
                            가입일: {new Date(result.createdAt).toLocaleDateString("ko-KR")}
                        </div>
                    </div>
                    <div className="flex gap-2 justify-center">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="border border-border text-muted-foreground hover:border-primary hover:text-primary px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                            다시 찾기
                        </button>
                        <Link
                            to="/auth/login"
                            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                        >
                            로그인하기
                        </Link>
                    </div>
                </div>
            ) : (
                /* ── 입력 폼 ── */
                <div className="space-y-4">
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

                    <div>
                        <label className="block text-sm font-medium text-[#333] mb-1.5">휴대폰 번호</label>
                        <div className="flex gap-2">
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                placeholder="010-0000-0000"
                                className={`${inputCls} flex-1`}
                            />
                            <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={!canSendOtp}
                                className="flex-shrink-0 flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 rounded-xl text-sm font-semibold transition-colors min-w-[88px]"
                            >
                                {sendingOtp ? (
                                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : otpSent ? (
                                    "재전송"
                                ) : (
                                    "인증"
                                )}
                            </button>
                        </div>
                        {!otpSent && error && (
                            <p className="text-xs text-red-500 mt-1.5">{error}</p>
                        )}
                    </div>

                    {/* ── 인증번호 입력 패널 (인증 버튼 클릭 시 노출) ── */}
                    {otpSent && (
                        <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <ShieldCheck size={13} className="text-primary flex-shrink-0" />
                                <span className="font-mono font-medium text-foreground">
                                    {phoneDigits.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3")}
                                </span>
                                로 인증번호를 발송했습니다.
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                    인증번호 (6자리)
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={code}
                                        onChange={(e) => setCode(digitsOnly(e.target.value))}
                                        placeholder="000000"
                                        className={`${inputCls} pr-16 tracking-[0.3em] font-mono bg-white`}
                                    />
                                    <span
                                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono ${
                                            timer <= 30 && timer > 0 ? "text-red-500" : "text-muted-foreground"
                                        }`}
                                    >
                                        {formatTime(timer)}
                                    </span>
                                </div>
                                {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
                                {timer === 0 && !error && (
                                    <p className="text-xs text-amber-600 mt-1.5">
                                        인증 시간이 만료되었습니다. 재전송 버튼을 눌러주세요.
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-0.5">
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={sendingOtp}
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary disabled:opacity-40 transition-colors"
                                >
                                    <RotateCcw size={11} />
                                    인증번호 재전송
                                </button>
                                <button
                                    type="button"
                                    onClick={handleVerify}
                                    disabled={!canVerify}
                                    className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
                                >
                                    {verifying ? (
                                        <>
                                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            확인 중...
                                        </>
                                    ) : (
                                        <>
                                            인증확인 <ArrowRight size={13} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {!otpSent && !error && (
                        <p className="text-xs text-muted-foreground bg-muted/40 rounded-xl p-3">
                            이름과 휴대폰 번호를 입력한 뒤 인증 버튼을 눌러 본인인증을 진행해 주세요.
                        </p>
                    )}
                </div>
            )}
        </>
    );
}