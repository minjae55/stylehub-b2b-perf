import {useEffect, useRef, useState} from "react";
import {ArrowRight, RotateCcw, ShieldCheck} from "lucide-react";

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

// ── Props 정의 ────────────────────────────────────────────────────────────────
interface OtpVerificationPanelProps {
    targetValue: string;                // 발송 대상 명칭 (예: "010-1234-5678" 또는 "test@email.com")
    timerResetTrigger: boolean;         // 타이머를 180초로 리셋시킬 신호 (otpSent 상탯값 등)
    onVerify: (code: string) => void;   // [인증확인] 버튼 눌렀을 때 부모가 처리할 함수
    onResend: () => void;               // [인증번호 재전송] 눌렀을 때 부모가 처리할 함수
    verifying: boolean;                 // 부모가 현재 API 검증 중인지 상태 (로딩 스피너용)
    sendingOtp: boolean;                // 부모가 현재 재전송 중인지 상태
    error: string;                      // 에러 메시지
}

export function OtpVerificationPanel({
                                         targetValue,
                                         timerResetTrigger,
                                         onVerify,
                                         onResend,
                                         verifying,
                                         sendingOtp,
                                         error
                                     }: OtpVerificationPanelProps) {
    const [code, setCode] = useState("");
    const [timer, setTimer] = useState(180);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const canVerify = code.length === 6 && !verifying && timer > 0;

    // 타이머 가동 효과 (기존 FindId 로직 그대로 이식)
    useEffect(() => {
        if (!timerResetTrigger) return;

        if (intervalRef.current) clearInterval(intervalRef.current);
        setTimer(180); // 신호가 오면 180초로 초기화

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
    }, [timerResetTrigger]);

    const handleVerifyClick = () => {
        if (!canVerify) return;
        onVerify(code);
    };

    const handleResendClick = () => {
        onResend();
        setCode(""); // 재전송 시 기존 입력칸 비우기
    };

    return (
        <div
            className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck size={13} className="text-primary flex-shrink-0"/>
                <span className="font-mono font-medium text-foreground">{targetValue}</span>
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
                    onClick={handleResendClick}
                    disabled={sendingOtp}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary disabled:opacity-40 transition-colors"
                >
                    <RotateCcw size={11}/>
                    인증번호 재전송
                </button>
                <button
                    type="button"
                    onClick={handleVerifyClick}
                    disabled={!canVerify}
                    className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
                >
                    {verifying ? (
                        <>
                            <span
                                className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                            확인 중...
                        </>
                    ) : (
                        <>
                            인증확인 <ArrowRight size={13}/>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}