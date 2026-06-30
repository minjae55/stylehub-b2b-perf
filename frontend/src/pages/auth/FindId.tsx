import {useState} from "react";
import {Link} from "react-router";
import {ArrowLeft, CheckCircle} from "lucide-react";
import {sendFindIdOtp, verifyFindIdOtp} from "@/api/auth/auth.service";
import {OtpVerificationPanel} from "@/app/components/ui/otp-vertification-panel"; // 💡 방금 만든 패널 가져오기

const inputCls =
    "w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors";

function digitsOnly(v: string) {
    return v.replace(/\D/g, "");
}

export function FindId() {
    const [name, setName]             = useState("");
    const [phone, setPhone]           = useState("");

    const [otpSent, setOtpSent]       = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifying, setVerifying]   = useState(false);
    const [error, setError]           = useState("");
    const [step, setStep]             = useState<"form" | "result">("form");

    const [result, setResult] = useState<{ maskedEmail: string; createdAt: string } | null>(null);

    const phoneDigits = digitsOnly(phone);
    const phoneValid  = phoneDigits.length >= 10;
    const canSendOtp = name.trim().length > 0 && phoneValid && !sendingOtp && !otpSent;

    const handlePhoneChange = (v: string) => {
        setPhone(v);
        if (otpSent) {
            setOtpSent(false);
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
        } catch (e: any) {
            setError(e.message ?? "인증번호 발송에 실패했습니다.");
        } finally {
            setSendingOtp(false);
        }
    };

    const handleVerify = async (code: string) => {
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

    return (
        <>
            <Link to="/auth"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-4">
                <ArrowLeft size={12}/> 로그인으로 돌아가기
            </Link>

            <h2 className="text-xl font-bold text-foreground mb-2">아이디 찾기</h2>
            <p className="text-sm text-muted-foreground mb-6">가입 시 등록한 이름과 휴대폰 번호로 아이디를 찾을 수 있습니다.</p>

            {step === "result" && result ? (
                <div className="text-center py-4 px-2">
                    <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={28} className="text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground mb-2">본인 인증이 완료되었습니다</h3>
                    <div className="bg-secondary border border-primary/20 rounded-xl p-4 mb-4 text-left">
                        <div className="text-xs text-muted-foreground mb-1">등록된 이메일 (아이디)</div>
                        <div className="font-mono font-semibold text-foreground">{result.maskedEmail}</div>
                        <div className="text-xs text-muted-foreground mt-2">
                            가입일: {new Date(result.createdAt).toLocaleDateString("ko-KR")}
                        </div>
                    </div>
                    <Link to="/auth"
                          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-semibold inline-block">
                        로그인하기
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#333] mb-1.5">이름</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="가입 시 등록한 이름"
                            disabled={otpSent}
                            className={`${inputCls} disabled:bg-secondary/40`}
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
                                className="bg-primary text-white px-4 rounded-xl text-sm font-semibold min-w-[88px]"
                            >
                                {sendingOtp ? "발송 중" : otpSent ? "발송완료" : "인증"}
                            </button>
                        </div>
                        {!otpSent && error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
                    </div>

                    {/* 공통 패널 호출 및 데이터 주입 */}
                    {otpSent && (
                        <OtpVerificationPanel
                            targetValue={phoneDigits.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3")}
                            timerResetTrigger={otpSent}
                            onVerify={handleVerify}
                            onResend={handleSendOtp}
                            verifying={verifying}
                            sendingOtp={sendingOtp}
                            error={error}
                        />
                    )}
                </div>
            )}
        </>
    );
}