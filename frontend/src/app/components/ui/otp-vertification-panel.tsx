import {useEffect, useRef, useState} from "react";
import {Loader2, RotateCcw, ShieldCheck} from "lucide-react";

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

interface OtpVerificationPanelProps {
    targetValue: string;
    initTimer?: number;
    timerResetTrigger: boolean;
    onVerify: (code: string) => void;
    onResend: () => void;
    verifying: boolean;
    sendingOtp: boolean;
    error: string;
}

export function OtpVerificationPanel({
                                         targetValue,
                                         initTimer = 180,
                                         timerResetTrigger,
                                         onVerify,
                                         onResend,
                                         verifying,
                                         sendingOtp,
                                         error
                                     }: OtpVerificationPanelProps) {
    const [code, setCode] = useState("");
    const [timer, setTimer] = useState(initTimer);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startTimer = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setTimer(initTimer);

        intervalRef.current = setInterval(() => {
            setTimer((t) => {
                if (t <= 1) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
    };

    // timerResetTrigger(부모의 otpSent 상태)가 변경될 때마다 타이머를 리셋하고 시작
    useEffect(() => {
        startTimer();
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [timerResetTrigger, initTimer]);

    const handleCodeChange = (val: string) => {
        const numericCode = digitsOnly(val);
        setCode(numericCode);

        if (numericCode.length === 6 && !verifying && timer > 0) {
            onVerify(numericCode);
        }
    };

    const handleResendClick = () => {
        if (sendingOtp) return;
        onResend(); // 부모 훅의 resend() 호출 -> 내부에서 API 전송 -> 성공 시 timerResetTrigger 토글됨
        setCode("");
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
                        onChange={(e) => handleCodeChange(e.target.value)}
                        placeholder="000000"
                        disabled={verifying || sendingOtp}
                        className={`${inputCls} pr-16 tracking-[0.3em] font-mono bg-white disabled:bg-muted/20`}
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

            <div className="flex items-center pt-0.5">
                <button
                    type="button"
                    onClick={handleResendClick}
                    disabled={sendingOtp}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary disabled:opacity-40 transition-colors"
                >
                    {sendingOtp ? (
                        <Loader2 size={11} className="animate-spin"/>
                    ) : (
                        <RotateCcw size={11}/>
                    )}
                    {sendingOtp ? "인증번호 발송 중..." : "인증번호 재전송"}
                </button>
            </div>
        </div>
    );
}