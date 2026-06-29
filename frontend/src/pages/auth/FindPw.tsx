import {useState} from "react";
import {Link} from "react-router";
import {ArrowLeft, CheckCircle} from "lucide-react";
import {resetPassword, sendFindPwOtp, verifyFindPwOtp} from "@/api/auth/auth.service";
import {OtpVerificationPanel} from "@/app/components/ui/otp-vertification-panel"; // 💡 공통 패널 사용

const inputCls =
    "w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors";

function isValidEmail(v: string) {
    return /\S+@\S+\.\S+/.test(v);
}

export function FindPw() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [step, setStep] = useState<"form" | "reset" | "success">("form");
    const [otpSent, setOtpSent] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [error, setError] = useState("");

    const [resetToken, setResetToken] = useState("");

    const canSendOtp = name.trim().length > 0 && isValidEmail(email) && !sendingOtp && !otpSent;
    const passwordMatch = newPassword.length >= 8 && newPassword === confirmPassword;

    const handleEmailChange = (v: string) => {
        setEmail(v);
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
            await sendFindPwOtp({name: name.trim(), email: email.trim()});
            setOtpSent(true);
        } catch (e: any) {
            setError(e.response?.data?.message || "인증번호 발송에 실패했습니다.");
        } finally {
            setSendingOtp(false);
        }
    };

    const handleVerify = async (code: string) => {
        setError("");
        setVerifying(true);
        try {
            const res = await verifyFindPwOtp({email: email.trim(), code});
            setResetToken(res.resetToken);
            setStep("reset"); // 검증 성공 시 새 비밀번호 설정 단계로 탈출!
        } catch (e: any) {
            setError(e.response?.data?.message || "인증번호가 일치하지 않습니다.");
        } finally {
            setVerifying(false);
        }
    };

    const handleResetPassword = async () => {
        if (!passwordMatch || resetting) return;
        setError("");
        setResetting(true);
        try {
            await resetPassword({resetToken, newPassword});
            setStep("success");
        } catch (e: any) {
            setError(e.response?.data?.message || "비밀번호 변경에 실패했습니다.");
        } finally {
            setResetting(false);
        }
    };

    return (
        <>
            <Link to="/auth"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-4">
                <ArrowLeft size={12}/> 로그인으로 돌아가기
            </Link>

            <h2 className="text-xl font-bold text-foreground mb-2">비밀번호 찾기</h2>

            {/* ── [단계 1 & 2] 이름, 이메일 입력 및 본인인증 ── */}
            {step === "form" && (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">가입 시 등록한 이름과 이메일 주소로 본인 인증 후 비밀번호를 재설정할 수
                        있습니다.</p>
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
                        <label className="block text-sm font-medium text-[#333] mb-1.5">가입 이메일 (아이디)</label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => handleEmailChange(e.target.value)}
                                placeholder="your@company.com"
                                disabled={otpSent}
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
                        {!otpSent && error &&
                            <p className="text-xs text-red-500 mt-1.5 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}
                    </div>

                    {/* 🧩 공통 패널 호출 및 데이터 주입 */}
                    {otpSent && (
                        <OtpVerificationPanel
                            targetValue={email}
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

            {/* ── [단계 3] 새 비밀번호 설정 입력 폼 ── */}
            {step === "reset" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                    <p className="text-sm text-muted-foreground mb-4">안전한 비밀번호로 새롭게 변경해 주세요. (영문, 숫자, 특수문자 조합 8자 이상)</p>
                    <div>
                        <label className="block text-sm font-medium text-[#333] mb-1.5">새 비밀번호</label>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                               placeholder="새 비밀번호 입력" className={inputCls}/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#333] mb-1.5">새 비밀번호 확인</label>
                        <input type="password" value={confirmPassword}
                               onChange={(e) => setConfirmPassword(e.target.value)} placeholder="새 비밀번호 재입력"
                               className={inputCls}/>
                        {confirmPassword && !passwordMatch &&
                            <p className="text-xs text-red-500 mt-1.5">비밀번호가 일치하지 않거나 8자 미만입니다.</p>}
                        {error &&
                            <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl p-3 mt-1.5">{error}</p>}
                    </div>
                    <button type="button" onClick={handleResetPassword} disabled={!passwordMatch || resetting}
                            className="w-full bg-primary text-white py-3 rounded-xl text-sm font-semibold mt-2">
                        {resetting ? "변경 처리 중..." : "비밀번호 변경 완료"}
                    </button>
                </div>
            )}

            {/* ── [단계 4] 최종 성공 화면 ── */}
            {step === "success" && (
                <div className="text-center py-6 px-2 animate-in fade-in duration-200">
                    <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={28} className="text-primary"/>
                    </div>
                    <h3 className="font-bold text-foreground mb-2">비밀번호 변경 완료</h3>
                    <p className="text-sm text-muted-foreground mb-6">비밀번호가 정상적으로 변경되었습니다.<br/>새로운 비밀번호로 다시 로그인해 주세요.
                    </p>
                    <Link to="/auth"
                          className="inline-block bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold w-full text-center">
                        로그인하러 가기
                    </Link>
                </div>
            )}
        </>
    );
}