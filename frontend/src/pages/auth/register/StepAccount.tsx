/**
 * StepAccount.tsx
 * Step 1 — 계정 정보 (이메일 · 비밀번호 · 이름 · 휴대폰)
 */

import {useEffect, useRef, useState} from "react";
import {CheckCircle2, Eye, EyeOff, Loader2, User, XCircle} from "lucide-react";
import {OtpVerificationPanel} from "@/app/components/ui/otp-vertification-panel";
import {Field, formatPhoneNumber, inputCls, PasswordStrengthBar, type RegisterFormData} from "./shared";
import {
    checkEmailDuplicate, checkPhoneDuplicate,
    sendEmailOtp,
    sendPhoneOtp,
    verifyEmailOtp,
    verifyPhoneOtp,
} from "@/api/auth/auth.service";
import {toast} from "sonner";
import {ErrorResponse} from "@/api/types";

const DUPLICATE_CHECK_DEBOUNCE_MS = 800;

// ── 이메일 인증 훅 ────────────────────────────────────────────────────────────
//
// 상태 흐름
//   idle ──(0.8s 디바운스)──► checking ──► available  (가입 가능)
//                                    └───► duplicate  (이미 가입됨)
//   available ──(코드발송 클릭)──► sending ──► sent ──(인증성공)──► verified
//                                                ↑
//                                          재발송(resend)
//
// codeSent = sending | sent  → 이 구간 동안 이메일 input은 무조건 잠금

type EmailStatus =
    | "idle"
    | "checking"
    | "available"
    | "duplicate"
    | "sending"
    | "sent"
    | "verified";

function useEmailVerify(email: string) {
    const [status, setStatus] = useState<EmailStatus>("idle");
    const [verifyError, setVerifyError] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [sending, setSending] = useState(false);
    const [otpSent, setOtpSent] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const requestEmailRef = useRef("");
    // effect 안에서 "현재" status를 읽기 위한 ref.
    // status를 의존성 배열에 넣으면 effect 내부에서 setStatus 할 때마다
    // effect가 다시 실행되어 디바운스 타이머가 끝없이 재시작되는 무한루프가 생긴다.
    // → email이 바뀔 때만 effect를 재실행하고, 그 시점의 status 판단은 ref로 읽는다.
    const statusRef = useRef(status);
    statusRef.current = status;

    const isVerified = status === "verified";
    const isChecking = status === "checking";
    const isAvailable = status === "available";
    const isDuplicate = status === "duplicate";
    const codeSent = status === "sending" || status === "sent";

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        const currentStatus = statusRef.current;

        if (!isValidEmail) {
            if (currentStatus !== "idle") setStatus("idle");
            return;
        }

        // 발송중/발송완료/인증완료 상태에선 email이 코드로 바뀌는 게 아니므로
        // 이 분기로 들어올 일은 거의 없지만, 안전하게 자동 중복확인을 건너뜀
        if (currentStatus === "sent" || currentStatus === "sending" || currentStatus === "verified") return;

        debounceRef.current = setTimeout(async () => {
            requestEmailRef.current = email;
            setStatus("checking");
            try {
                await checkEmailDuplicate(email);
                if (requestEmailRef.current !== email) return;
                setStatus("available");
            } catch (error: any) {
                if (requestEmailRef.current !== email) return;
                const errorData: ErrorResponse | undefined = error?.response?.data;
                if (error?.response?.status === 409 || errorData?.code === "DUPLICATE_EMAIL") {
                    setStatus("duplicate");
                } else {
                    setStatus("idle");
                    toast.error("중복확인 실패", {
                        description: errorData?.message || "중복확인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
                    });
                }
            }
        }, DUPLICATE_CHECK_DEBOUNCE_MS);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [email, isValidEmail]);

    /** 최초 발송 — available 상태에서만 호출 가능 */
    const sendCode = async () => {
        if (sending || !isAvailable) return;
        await doSend(false);
    };

    /** 재발송 — 이미 sent 상태에서 호출, available 체크를 건너뜀 */
    const resend = async () => {
        if (sending) return;
        await doSend(true);
    };

    const doSend = async (isResend: boolean) => {
        try {
            setSending(true);
            setStatus("sending");
            setVerifyError("");

            await sendEmailOtp(email);

            setStatus("sent");
            setOtpSent((v) => !v); // 타이머 리셋 트리거
            toast.success(isResend ? "인증 코드를 재발송했습니다." : "인증 코드를 발송했습니다.", {
                description: `${email}로 6자리 코드를 보냈어요.`,
            });
        } catch (error: any) {
            // 재발송 실패면 sent 상태 유지, 최초 발송 실패면 available로 복귀
            setStatus(isResend ? "sent" : "available");
            const errorData: ErrorResponse | undefined = error?.response?.data;
            toast.error("발송 실패", {description: errorData?.message || "인증 코드 발송에 실패했습니다."});
        } finally {
            setSending(false);
        }
    };

    const verifyCode = async (code: string) => {
        try {
            setVerifying(true);
            setVerifyError("");
            await verifyEmailOtp({email, code});
            setStatus("verified"); // → isVerified 즉시 true, 부모 useEffect로 실시간 전파
            toast.success("이메일 인증 완료!");
        } catch (error: any) {
            const errorData: ErrorResponse | undefined = error?.response?.data;
            setVerifyError(errorData?.message || "코드가 올바르지 않거나 만료되었습니다.");
        } finally {
            setVerifying(false);
        }
    };

    const reset = () => {
        setStatus("idle");
        setVerifyError("");
    };

    const btnLabel = sending
        ? "발송 중..."
        : isVerified ? "재인증"
            : codeSent ? "재발송"
                : "인증코드 발송";

    return {
        status, isVerified, isChecking, isAvailable, isDuplicate, codeSent,
        verifying, sending, verifyError,
        btnLabel, isValidEmail, otpSent,
        sendCode, resend, verifyCode, reset,
    };
}

// ── 휴대폰 인증 훅 — 이메일과 동일한 잠금/재발송 패턴 ────────────────────────

type PhoneStatus =
    | "idle"
    | "checking"
    | "available"
    | "duplicate"
    | "sending"
    | "sent"
    | "verified";

function usePhoneVerify(phone: string) {
    const [status, setStatus] = useState<PhoneStatus>("idle");
    const [verifyError, setVerifyError] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [sending, setSending] = useState(false);
    const [otpSent, setOtpSent] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const requestPhoneRef = useRef("");
    const statusRef = useRef(status);
    statusRef.current = status;

    const isVerified = status === "verified";
    const isChecking = status === "checking";
    const isAvailable = status === "available";
    const isDuplicate = status === "duplicate";
    const codeSent = status === "sending" || status === "sent";

    const isValidPhone = /^01[016789][0-9]{3,4}[0-9]{4}$/.test(phone.replace(/-/g, ""));

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        const currentStatus = statusRef.current;
        const cleaned = phone.replace(/-/g, "");

        if (!isValidPhone) {
            if (currentStatus !== "idle") setStatus("idle");
            return;
        }

        if (currentStatus === "sent" || currentStatus === "sending" || currentStatus === "verified") return;

        debounceRef.current = setTimeout(async () => {
            requestPhoneRef.current = cleaned;
            setStatus("checking");
            try {
                // 백엔드에 만들어둔 휴대폰 중복체크 API 호출 (예시 명칭 기재)
                // 만약 단독 API가 없다면 기존 sendPhoneOtp 진입 전 예외를 catch하여 판단해야 하나,
                // 안전한 사용을 위해 checkPhoneDuplicate(cleaned) API를 연동하는 것을 권장합니다.
                await checkPhoneDuplicate(cleaned);
                if (requestPhoneRef.current !== cleaned) return;
                setStatus("available");
            } catch (error: any) {
                if (requestPhoneRef.current !== cleaned) return;
                const errorData: ErrorResponse | undefined = error?.response?.data;
                // 409 Conflict 이거나 특정 코드 매핑 시 중복으로 판정
                if (error?.response?.status === 409 || errorData?.code === "DUPLICATE_PHONE_NUMBER") {
                    setStatus("duplicate");
                } else {
                    setStatus("idle");
                    // 이메일 중복확인과 동일하게 실패 사유를 사용자에게 알림
                    toast.error("중복확인 실패", {
                        description: errorData?.message || "중복확인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
                    });
                }
            }
        }, DUPLICATE_CHECK_DEBOUNCE_MS);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [phone, isValidPhone]);

    /** 최초 발송 — 유효한 번호일 때만 */
    const sendCode = async () => {
        if (sending || !isValidPhone) return;
        await doSend(false);
    };

    /** 재발송 — sent 상태에서 호출, 번호 유효성 재확인 없이 그대로 재전송 */
    const resend = async () => {
        if (sending) return;
        await doSend(true);
    };

    const doSend = async (isResend: boolean) => {
        try {
            setSending(true);
            setStatus("sending");
            setVerifyError("");
            const cleaned = phone.replace(/-/g, "");
            await sendPhoneOtp({phone: cleaned});
            setStatus("sent");
            setOtpSent((v) => !v); // 타이머 리셋 트리거
            toast.success(isResend ? "인증번호를 재발송했습니다." : "인증번호를 발송했습니다.");
        } catch (error: any) {
            setStatus(isResend ? "sent" : "idle");
            const errorData: ErrorResponse | undefined = error?.response?.data;
            toast.error("발송 실패", {description: errorData?.message || "인증번호 발송에 실패했습니다."});
        } finally {
            setSending(false);
        }
    };

    const verifyCode = async (code: string) => {
        try {
            setVerifying(true);
            setVerifyError("");
            const cleaned = phone.replace(/-/g, "");
            await verifyPhoneOtp({phone: cleaned, code});
            setStatus("verified"); // → isVerified 즉시 true, 부모 useEffect로 실시간 전파
            toast.success("휴대폰 인증 완료!");
        } catch (error: any) {
            const errorData: ErrorResponse | undefined = error?.response?.data;
            setVerifyError(errorData?.message || "번호가 올바르지 않거나 만료되었습니다.");
        } finally {
            setVerifying(false);
        }
    };

    const reset = () => {
        setStatus("idle");
        setVerifyError("");
    };

    const btnLabel = sending
        ? "발송 중..."
        : isVerified ? "재인증"
            : codeSent ? "재발송"
                : "인증번호 발송";

    return {
        isVerified, codeSent,
        verifying, sending, verifyError,
        btnLabel, isValidPhone, otpSent,
        sendCode, resend, verifyCode, reset,
        isChecking, isAvailable, isDuplicate
    };
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface StepAccountProps {
    form: RegisterFormData;
    set: (partial: Partial<RegisterFormData>) => void;
    setIsEmailVerified: (v: boolean) => void;
    setIsPhoneVerified: (v: boolean) => void;
    fieldErrors?: Record<string, string>;
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export function StepAccount({
                                form, set, setIsEmailVerified, setIsPhoneVerified, fieldErrors
                            }: StepAccountProps) {
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const isNameValid = form.name.length > 0 && /^(^[가-힣]{1,5}$)$|^(^[a-zA-Z\s]{2,20}$)$/.test(form.name);

    const isPasswordValid =
        form.password.length >= 8 &&
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(form.password);

    const pwMismatch = form.confirmPassword && form.password !== form.confirmPassword;

    const email = useEmailVerify(form.email);
    const phone = usePhoneVerify(form.phone);

    // 인증 완료 여부 → 부모(Register) 상태로 실시간 동기화
    useEffect(() => {
        setIsEmailVerified(email.isVerified);
    }, [email.isVerified, setIsEmailVerified]);
    useEffect(() => {
        setIsPhoneVerified(phone.isVerified);
    }, [phone.isVerified, setIsPhoneVerified]);

    const handleEmailChange = (v: string) => {
        set({email: v});
        email.reset(); // 값이 바뀌면 무조건 idle로 — 디바운스가 새로 중복확인을 돌림
    };

    const handlePhoneChange = (v: string) => {
        set({
            phone: formatPhoneNumber(v),
        });
        phone.reset();
    };

    /** 이메일 버튼 클릭 — 인증완료/발송전/재발송 세 가지 경우를 명시적으로 분기 */
    const handleEmailBtnClick = () => {
        if (email.isVerified) {
            email.reset();
            return;
        }
        if (email.codeSent) {
            email.resend();
            return;
        }
        email.sendCode();
    };

    /** 휴대폰 버튼 클릭 — 동일 패턴 */
    const handlePhoneBtnClick = () => {
        if (phone.isVerified) {
            phone.reset();
            return;
        }
        if (phone.codeSent) {
            phone.resend();
            return;
        }
        phone.sendCode();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <User size={14} className="text-primary"/> 계정 정보
            </div>

            {/* 이메일 입력 */}
            <Field
                label="아이디 (이메일)"
                required
                hint={email.isVerified ? undefined : "가입 후 로그인 및 알림 수신에 사용됩니다."}
            >
                <div className="flex gap-2">
                    <input
                        type="email"
                        value={form.email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        placeholder="your@company.com"
                        // codeSent 구간(발송중~인증대기) 동안에도 반드시 잠겨있어야 함
                        disabled={email.isVerified || email.codeSent}
                        className={`${inputCls} ${
                            email.isVerified ? "border-emerald-400 bg-emerald-50/40"
                                : email.isDuplicate ? "border-red-400"
                                    : email.isAvailable ? "border-emerald-300"
                                        : ""
                        } ${email.isVerified || email.codeSent ? "bg-muted/30 text-muted-foreground" : ""}`}
                    />
                    {/* 코드 발송 후(codeSent)에는 패널 안의 "인증번호 재전송" 버튼이
                        같은 역할을 하므로 여기 버튼은 숨김 — 중복 노출 방지 */}
                    {!email.codeSent && (
                        <button
                            type="button"
                            onClick={handleEmailBtnClick}
                            disabled={email.sending || (!email.isVerified && !email.isAvailable)}
                            className={`shrink-0 px-3 py-2.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
                                email.isVerified
                                    ? "bg-muted text-muted-foreground hover:bg-muted/80"
                                    : "bg-primary hover:bg-primary/90 disabled:opacity-50 text-white"
                            }`}
                        >
                            {email.btnLabel}
                        </button>
                    )}
                </div>

                {/* 실시간 중복확인 결과 — 코드 발송 전까지만 노출 */}
                {!email.codeSent && !email.isVerified && (
                    <>
                        {email.isChecking && (
                            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                                <Loader2 size={12} className="animate-spin"/> 중복 확인 중...
                            </p>
                        )}
                        {email.isAvailable && (
                            <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                                <CheckCircle2 size={12}/> 가입 가능한 이메일입니다.
                            </p>
                        )}
                        {email.isDuplicate && (
                            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                <XCircle size={12}/> 이미 가입된 이메일입니다.
                            </p>
                        )}
                    </>
                )}

                {/* OTP 입력 패널 — 발송중/발송완료(codeSent) 동안 노출, 인증완료 시 즉시 접힘 */}
                <div className={`transition-all duration-300 overflow-hidden ${
                    email.codeSent ? "max-h-56 opacity-100 mt-2" : "max-h-0 opacity-0"
                }`}>
                    {email.codeSent && (
                        <OtpVerificationPanel
                            targetValue={form.email}
                            initTimer={300}
                            timerResetTrigger={email.otpSent}
                            onVerify={email.verifyCode}
                            onResend={email.resend}
                            verifying={email.verifying}
                            sendingOtp={email.sending}
                            error={email.verifyError}
                        />
                    )}
                </div>

                {/* 인증 완료 — isVerified가 true로 바뀌는 순간 즉시 렌더 (codeSent는 이미 false) */}
                {email.isVerified && (
                    <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                        <CheckCircle2 size={12}/> 이메일 인증이 완료되었습니다.
                    </p>
                )}
                {fieldErrors?.email && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
                )}
            </Field>

            {/* 비밀번호 입력 */}
            <Field label="비밀번호" required>
                <div className="relative">
                    <input
                        type={showPw ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => set({password: e.target.value})}
                        placeholder="영문, 숫자, 특수문자를 포함하여 8자 이상"
                        className={`${inputCls} pr-10 ${form.password && !isPasswordValid ? "border-amber-400" : ""}`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                </div>

                {form.password && !isPasswordValid && (
                    <p className="text-xs text-amber-600 mt-1">
                        영문자, 숫자, 특수문자(@$!%*#?&)를 각각 최소 1자 이상 포함해야 합니다.
                    </p>
                )}

                <PasswordStrengthBar password={form.password}/>
                {fieldErrors?.password && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
                )}
            </Field>

            {/* 비밀번호 확인 */}
            <Field label="비밀번호 확인" required>
                <div className="relative">
                    <input
                        type={showConfirm ? "text" : "password"}
                        value={form.confirmPassword}
                        onChange={(e) => set({confirmPassword: e.target.value})}
                        placeholder="비밀번호 재입력"
                        disabled={!isPasswordValid}
                        className={`${inputCls} pr-10 ${pwMismatch ? "border-red-400" : ""} disabled:opacity-50`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        disabled={!isPasswordValid}
                    >
                        {showConfirm ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                </div>
                {pwMismatch && (
                    <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>
                )}
                {fieldErrors?.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.confirmPassword}</p>
                )}
            </Field>

            <hr className="border-border"/>

            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <User size={14} className="text-primary"/> 담당자 정보
            </div>

            {/* 이름 */}
            <Field label="이름" required>
                <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set({name: e.target.value})}
                    placeholder="홍길동 또는 가입 성명 (영문 2~20자)"
                    className={`${inputCls} ${
                        form.name
                            ? isNameValid
                                ? "border-emerald-400 bg-emerald-50/10"
                                : "border-amber-400"
                            : ""
                    }`}
                />
                {form.name && !isNameValid && (
                    <p className="text-xs text-amber-600 mt-1">
                        이름은 한글 1~5자 또는 영문 2~20자(공백 포함)로 입력해 주세요.
                    </p>
                )}
                {fieldErrors?.name && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>
                )}
            </Field>

            {/* 휴대폰 번호 */}
            <Field
                label="휴대폰 번호"
                required
                hint={phone.isVerified ? undefined : "주문·배송 관련 긴급 연락에 사용됩니다."}
            >
                <div className="flex gap-2">
                    <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="01000000000 ('-' 없이 숫자만)"
                        disabled={phone.isVerified || phone.codeSent}
                        className={`${inputCls} ${
                            phone.isVerified ? "border-emerald-400 bg-emerald-50/40"
                                : phone.isDuplicate ? "border-red-400"
                                    : phone.isAvailable ? "border-emerald-300"
                                        : form.phone && !phone.isValidPhone ? "border-amber-400"
                                            : ""
                        } ${phone.isVerified || phone.codeSent ? "bg-muted/30 text-muted-foreground" : ""}`}
                    />
                    {!phone.codeSent && (
                        <button
                            type="button"
                            onClick={handlePhoneBtnClick}
                            disabled={phone.sending || (!phone.isVerified && !phone.isAvailable)}
                            className={`shrink-0 px-3 py-2.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
                                phone.isVerified
                                    ? "bg-muted text-muted-foreground hover:bg-muted/80"
                                    : "bg-primary hover:bg-primary/90 disabled:opacity-50 text-white"
                            }`}
                        >
                            {phone.btnLabel}
                        </button>
                    )}
                </div>

                {form.phone && !phone.isValidPhone && !phone.codeSent && (
                    <p className="text-xs text-amber-600 mt-1">
                        올바른 휴대폰 번호 형식이 아닙니다. (010으로 시작하는 10~11자리 숫자)
                    </p>
                )}

                {!phone.codeSent && !phone.isVerified && phone.isValidPhone && (
                    <>
                        {phone.isChecking && (
                            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                                <Loader2 size={12} className="animate-spin"/> 번호 중복 확인 중...
                            </p>
                        )}
                        {phone.isAvailable && (
                            <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                                <CheckCircle2 size={12}/> 가입 가능한 휴대폰 번호입니다.
                            </p>
                        )}
                        {phone.isDuplicate && (
                            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                <XCircle size={12}/> 이미 가입된 휴대폰 번호입니다. 다른 번호를 입력해 주세요.
                            </p>
                        )}
                    </>
                )}

                {/* OTP 입력 패널 — 발송중/발송완료 동안 노출, 인증완료 시 즉시 접힘 */}
                <div className={`transition-all duration-300 overflow-hidden ${
                    phone.codeSent ? "max-h-56 opacity-100 mt-2" : "max-h-0 opacity-0"
                }`}>
                    {phone.codeSent && (
                        <OtpVerificationPanel
                            targetValue={form.phone}
                            initTimer={180}
                            timerResetTrigger={phone.otpSent}
                            onVerify={phone.verifyCode}
                            onResend={phone.resend}
                            verifying={phone.verifying}
                            sendingOtp={phone.sending}
                            error={phone.verifyError}
                        />
                    )}
                </div>

                {phone.isVerified && (
                    <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                        <CheckCircle2 size={12}/> 휴대폰 인증이 완료되었습니다.
                    </p>
                )}
                {fieldErrors?.phone && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>
                )}
            </Field>
        </div>
    );
}