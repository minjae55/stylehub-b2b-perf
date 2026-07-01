import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, Briefcase, Building2, Camera, CheckCircle2, IdCard, Loader2, Lock, User, XCircle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { formatPhoneNumber } from "@/pages/auth/register/shared";
import {
    checkEmailDuplicate,
    checkPhoneDuplicate,
    sendEmailChangeOtp,
    sendPhoneChangeOtp,
    uploadFile,
    verifyEmailChangeOtp,
    verifyPhoneChangeOtp,
} from "@/api/auth/auth.service";
import { updateProfileInfo, verifyGatePassword } from "@/api/user/user.service";
import { OtpVerificationPanel } from "@/app/components/ui/otp-vertification-panel";
import { toast } from "sonner";
import { ErrorResponse } from "@/api/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProfileForm {
    email: string;
    phone: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 800;

const inputCls =
    "w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white text-foreground shadow-sm font-medium text-left disabled:bg-muted/30 disabled:text-muted-foreground/60";

const readonlyCls =
    "w-full rounded-xl px-4 py-3 text-sm bg-muted/50 text-muted-foreground/80 cursor-not-allowed flex items-center justify-between border border-transparent select-none font-medium text-left";

const btnSecondaryCls =
    "whitespace-nowrap px-4 py-3 bg-muted hover:bg-muted/80 text-muted-foreground border border-border rounded-xl text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const stripHyphen = (v: string) => v.replace(/-/g, "");

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground mb-6">
            <span className="text-primary">{icon}</span>
            {title}
        </h2>
    );
}

const getBusinessRoleLabel = (businessRole: string) => {
    switch (businessRole) {
        case "BOTH":     return "통합 관리자 (구매/판매)";
        case "SELLER":   return "공급사";
        case "BUYER":    return "고객사";
        default:         return businessRole;
    }
};

const getRoleLabel = (role: string) => {
    switch (role) {
        case "ADMIN":     return "총괄 관리자";
        case "PRESIDENT": return "대표 / 사장";
        case "EMPLOYEE":  return "직원";
        default:          return "일반 회원";
    }
};

// ── 공통 상태 타입 ────────────────────────────────────────────────────────────

type FieldStatus = "idle" | "checking" | "available" | "duplicate" | "sending" | "sent" | "verified";

// ── OTP 훅 — 이메일 변경 인증 ─────────────────────────────────────────────────
//
// isChanged: 현재 입력값이 기존 값과 다른지 여부
//   → false이면 디바운스 중복확인을 아예 건너뜀 (진입 시 409 방지)
//   → true일 때만 checking → available/duplicate 흐름 진행

function useEmailChangeOtp(email: string, isChanged: boolean) {
    const [status, setStatus]           = useState<FieldStatus>("idle");
    const [verifyError, setVerifyError] = useState("");
    const [verifying, setVerifying]     = useState(false);
    const [sending, setSending]         = useState(false);
    const [otpSent, setOtpSent]         = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const requestRef  = useRef("");
    // status를 ref로 읽어서 effect 의존성에서 제외 (무한루프 방지)
    const statusRef   = useRef(status);
    statusRef.current = status;

    const isVerified  = status === "verified";
    const isChecking  = status === "checking";
    const isAvailable = status === "available";
    const isDuplicate = status === "duplicate";
    const codeSent    = status === "sending" || status === "sent";
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        const cur = statusRef.current;

        // 값이 바뀌지 않았으면 중복확인 완전 스킵 — 진입 시 자기 이메일로 409 뜨는 문제 방지
        if (!isChanged) {
            if (cur !== "idle") setStatus("idle");
            return;
        }

        if (!isValidEmail) {
            if (cur !== "idle") setStatus("idle");
            return;
        }

        if (cur === "sent" || cur === "sending" || cur === "verified") return;

        debounceRef.current = setTimeout(async () => {
            requestRef.current = email;
            setStatus("checking");
            try {
                await checkEmailDuplicate(email);
                if (requestRef.current !== email) return;
                setStatus("available");
            } catch (error: any) {
                if (requestRef.current !== email) return;
                const err: ErrorResponse = error?.response?.data;
                if (err?.status === 409 || error?.response?.status === 409 || err?.code === "DUPLICATE_EMAIL") {
                    setStatus("duplicate");
                } else {
                    setStatus("idle");
                }
            }
        }, DEBOUNCE_MS);

        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [email, isValidEmail, isChanged]);

    const doSend = async (isResend: boolean) => {
        try {
            setSending(true);
            setStatus("sending");
            setVerifyError("");
            await sendEmailChangeOtp({ target: email });
            setStatus("sent");
            setOtpSent((v) => !v);
            toast.success(isResend ? "인증 코드를 재발송했습니다." : "인증 코드를 발송했습니다.", {
                description: `${email}로 6자리 코드를 보냈어요.`,
            });
        } catch (err: any) {
            setStatus(isResend ? "sent" : "available");
            toast.error("발송 실패", { description: err.response?.data?.message || "인증번호 발송에 실패했습니다." });
        } finally {
            setSending(false);
        }
    };

    const sendCode  = () => { if (!sending && isAvailable) doSend(false); };
    const resend    = () => { if (!sending) doSend(true); };

    const verifyCode = async (code: string) => {
        try {
            setVerifying(true);
            setVerifyError("");
            await verifyEmailChangeOtp({ target: email, otpCode: code });
            setStatus("verified");
            toast.success("이메일 인증이 완료되었습니다.");
        } catch (err: any) {
            setVerifyError(err.response?.data?.message || "인증번호가 일치하지 않습니다.");
        } finally {
            setVerifying(false);
        }
    };

    const reset = () => { setStatus("idle"); setVerifyError(""); };

    return {
        isVerified, isChecking, isAvailable, isDuplicate, codeSent, otpSent,
        verifying, sending, verifyError,
        sendCode, resend, verifyCode, reset,
    };
}

// ── OTP 훅 — 휴대폰 변경 인증 ────────────────────────────────────────────────

function usePhoneChangeOtp(phone: string, isChanged: boolean) {
    const [status, setStatus]           = useState<FieldStatus>("idle");
    const [verifyError, setVerifyError] = useState("");
    const [verifying, setVerifying]     = useState(false);
    const [sending, setSending]         = useState(false);
    const [otpSent, setOtpSent]         = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const requestRef  = useRef("");
    const statusRef   = useRef(status);
    statusRef.current = status;

    const isVerified  = status === "verified";
    const isChecking  = status === "checking";
    const isAvailable = status === "available";
    const isDuplicate = status === "duplicate";
    const codeSent    = status === "sending" || status === "sent";

    const cleaned      = phone.replace(/-/g, "");
    const isValidPhone = /^01[016789][0-9]{3,4}[0-9]{4}$/.test(cleaned);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        const cur = statusRef.current;

        // 값이 바뀌지 않았으면 중복확인 스킵
        if (!isChanged) {
            if (cur !== "idle") setStatus("idle");
            return;
        }

        if (!isValidPhone) {
            if (cur !== "idle") setStatus("idle");
            return;
        }

        if (cur === "sent" || cur === "sending" || cur === "verified") return;

        debounceRef.current = setTimeout(async () => {
            requestRef.current = cleaned;
            setStatus("checking");
            try {
                await checkPhoneDuplicate(cleaned);
                if (requestRef.current !== cleaned) return;
                setStatus("available");
            } catch (error: any) {
                if (requestRef.current !== cleaned) return;
                const err: ErrorResponse = error?.response?.data;
                if (err?.status === 409 || error?.response?.status === 409 || err?.code === "DUPLICATE_PHONE_NUMBER") {
                    setStatus("duplicate");
                } else {
                    // 중복확인 API 에러 시 진행 허용 (프로필은 관대하게)
                    setStatus("available");
                }
            }
        }, DEBOUNCE_MS);

        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [phone, isValidPhone, isChanged]);

    const doSend = async (isResend: boolean) => {
        try {
            setSending(true);
            setStatus("sending");
            setVerifyError("");
            await sendPhoneChangeOtp({ target: cleaned });
            setStatus("sent");
            setOtpSent((v) => !v);
            toast.success(isResend ? "인증번호를 재발송했습니다." : "인증번호를 발송했습니다.");
        } catch (err: any) {
            setStatus(isResend ? "sent" : "available");
            toast.error("발송 실패", { description: err.response?.data?.message || "인증번호 발송에 실패했습니다." });
        } finally {
            setSending(false);
        }
    };

    const sendCode  = () => { if (!sending && isAvailable) doSend(false); };
    const resend    = () => { if (!sending) doSend(true); };

    const verifyCode = async (code: string) => {
        try {
            setVerifying(true);
            setVerifyError("");
            await verifyPhoneChangeOtp({ target: cleaned, otpCode: code });
            setStatus("verified");
            toast.success("연락처 인증이 완료되었습니다.");
        } catch (err: any) {
            setVerifyError(err.response?.data?.message || "인증번호가 일치하지 않습니다.");
        } finally {
            setVerifying(false);
        }
    };

    const reset = () => { setStatus("idle"); setVerifyError(""); };

    return {
        isVerified, isChecking, isAvailable, isDuplicate, codeSent, otpSent,
        verifying, sending, verifyError, isValidPhone,
        sendCode, resend, verifyCode, reset,
    };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProfileTab() {
    const { user, setUser, clearUser } = useAuthStore();

    const [isTabUnlocked, setIsTabUnlocked] = useState(false);
    const [gatePassword, setGatePassword]   = useState("");
    const [gateError, setGateError]         = useState("");
    const [verifyingGate, setVerifyingGate] = useState(false);

    const [form, setForm]           = useState<ProfileForm>({ email: "", phone: "" });
    const [preview, setPreview]     = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [saving, setSaving]   = useState(false);
    const [saved, setSaved]     = useState(false);
    const [fieldErrors, setFieldErrors]         = useState<Record<string, string>>({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const imgRef = useRef<HTMLInputElement>(null);

    // isChanged 계산 — 훅보다 먼저 해야 훅에 넘길 수 있음
    const isEmailChanged = !!user && user.email !== form.email;
    const isPhoneChanged = !!user && stripHyphen(user.phone || "") !== stripHyphen(form.phone);

    // isChanged를 훅에 직접 넘겨서 진입 시 불필요한 중복확인 차단
    const emailOtp = useEmailChangeOtp(form.email, isEmailChanged);
    const phoneOtp = usePhoneChangeOtp(form.phone, isPhoneChanged);

    useEffect(() => {
        if (user) {
            setForm({
                email: user.email || "",
                phone: formatPhoneNumber(user.phone || ""),
            });
        }
    }, [user]);

    const set = (p: Partial<ProfileForm>) => {
        setForm((f) => ({ ...f, ...p }));
        setFieldErrors({});
    };

    const handleEmailChange = (v: string) => {
        set({ email: v });
        emailOtp.reset();
    };

    const handlePhoneChange = (v: string) => {
        set({ phone: formatPhoneNumber(v) });
        phoneOtp.reset();
    };

    const handleGateVerify = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!gatePassword.trim() || verifyingGate) return;
        setVerifyingGate(true);
        setGateError("");
        try {
            await verifyGatePassword(gatePassword);
            setIsTabUnlocked(true);
        } catch (err: any) {
            setGateError(err.response?.data?.message || "비밀번호가 일치하지 않습니다.");
        } finally {
            setVerifyingGate(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        setSaving(true);
        setFieldErrors({});
        try {
            let uploadedUrl = user?.profileImageUrl || null;
            if (imageFile) uploadedUrl = await uploadFile(imageFile);

            const updatedUser = await updateProfileInfo({
                email:           form.email,
                phone:           stripHyphen(form.phone), // 하이픈 제거 후 전송
                profileImageUrl: uploadedUrl,
            });

            setUser(updatedUser);
            setSaved(true);
            setImageFile(null);
            emailOtp.reset();
            phoneOtp.reset();
            setTimeout(() => setSaved(false), 2500);
        } catch (error: any) {
            const errors = error.response?.data?.fieldErrors;
            if (errors) setFieldErrors(errors);
            else toast.error("저장 실패", { description: error.response?.data?.message || "정보 수정 중 오류가 발생했습니다." });
        } finally {
            setSaving(false);
        }
    };

    const handleWithdraw = async () => {
        try {
            // await api.delete("/users/me");
            toast.success("회원 탈퇴가 완료되었습니다.");
            clearUser();
        } catch (error: any) {
            toast.error("탈퇴 실패", { description: error.response?.data?.message || "탈퇴 처리 중 오류가 발생했습니다." });
        }
    };

    if (!user) return null;

    if (!isTabUnlocked) {
        return (
            <div className="max-w-md mx-auto py-24 text-left">
                <div className="bg-white border border-border rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <Lock size={20} className="text-primary" /> 비밀번호 재확인
                        </h2>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            회원님의 소중한 정보를 보호하기 위해 현재 로그인된 계정의 비밀번호를 다시 한번 확인합니다.
                        </p>
                    </div>
                    <form onSubmit={handleGateVerify} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground">비밀번호</label>
                            <input
                                type="password"
                                placeholder="현재 비밀번호를 입력해 주세요"
                                value={gatePassword}
                                onChange={(e) => setGatePassword(e.target.value)}
                                className={inputCls}
                                autoFocus
                            />
                            {gateError && <p className="text-xs text-red-500 font-medium">{gateError}</p>}
                        </div>
                        <button
                            type="submit"
                            disabled={verifyingGate || !gatePassword.trim()}
                            className="w-full bg-primary hover:bg-primary/95 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-40"
                        >
                            {verifyingGate ? "확인 중..." : "확인"}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const avatarSrc = preview || user.profileImageUrl;
    const initials  = user.name ? user.name.slice(0, 2) : "유저";

    const isSaveDisabled =
        saving ||
        (isEmailChanged && !emailOtp.isVerified) ||
        (isPhoneChanged && !phoneOtp.isVerified) ||
        (!isEmailChanged && !isPhoneChanged && !imageFile);

    return (
        <div className="max-w-4xl mx-auto space-y-12 py-4 text-left">
            <section>
                <SectionHeader icon={<User size={18} />} title="내 정보 수정" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start mt-8">

                    {/* 프로필 이미지 */}
                    <div className="flex flex-col items-center p-8 bg-muted/30 border border-border/60 rounded-2xl space-y-4 text-center">
                        <div className="relative group">
                            <div
                                onClick={() => imgRef.current?.click()}
                                className="w-32 h-32 rounded-full bg-primary/5 text-primary font-black text-3xl flex items-center justify-center overflow-hidden cursor-pointer border-2 border-border hover:border-primary/40 shadow-sm transition-all relative"
                            >
                                {avatarSrc
                                    ? <img src={avatarSrc} alt="프로필" className="w-full h-full object-cover" />
                                    : initials}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <Camera size={24} className="text-white" />
                                </div>
                            </div>
                            <div
                                onClick={() => imgRef.current?.click()}
                                className="absolute bottom-0 right-0 bg-white border border-border p-2 rounded-full shadow-md cursor-pointer hover:scale-110 transition-transform"
                            >
                                <Camera size={14} className="text-muted-foreground" />
                            </div>
                            <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                        </div>
                        <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide">
                            {getRoleLabel(user.role)}
                        </div>
                    </div>

                    {/* 상세 필드 */}
                    <div className="md:col-span-2 space-y-5">

                        {/* 읽기 전용 */}
                        <div className="space-y-5">
                            {[
                                { icon: <Building2 size={13} />, label: "소속 회사",       value: user.companyName || "미지정 소속" },
                                { icon: <IdCard size={13} />,    label: "이름",             value: user.name },
                                { icon: <Briefcase size={13} />, label: "플랫폼 권한 범위", value: getBusinessRoleLabel(user.businessRole) },
                            ].map(({ icon, label, value }) => (
                                <div key={label} className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2 sm:gap-4">
                                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 tracking-wide">
                                        {icon} {label}
                                    </label>
                                    <div className="sm:col-span-2">
                                        <div className={readonlyCls}>
                                            <span>{value}</span>
                                            <Lock size={12} className="text-muted-foreground/30" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 수정 가능 */}
                        <div className="pt-6 border-t border-dashed border-border space-y-5">

                            {/* ── 이메일 ── */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2 sm:gap-4">
                                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 tracking-wide pt-3">
                                    이메일 주소
                                </label>
                                <div className="sm:col-span-2 space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => handleEmailChange(e.target.value)}
                                            placeholder="example@company.com"
                                            disabled={emailOtp.codeSent || emailOtp.isVerified}
                                            className={`${inputCls} ${
                                                emailOtp.isVerified   ? "border-emerald-400 bg-emerald-50/30"
                                                    : emailOtp.isDuplicate ? "border-red-400"
                                                        : emailOtp.isAvailable ? "border-emerald-300"
                                                            : ""
                                            } ${emailOtp.codeSent || emailOtp.isVerified ? "bg-muted/30" : ""}`}
                                        />
                                        {isEmailChanged && !emailOtp.codeSent && !emailOtp.isVerified && (
                                            <button
                                                type="button"
                                                onClick={emailOtp.sendCode}
                                                disabled={emailOtp.sending || !emailOtp.isAvailable}
                                                className={btnSecondaryCls}
                                            >
                                                {emailOtp.sending ? "발송 중..." : "인증요청"}
                                            </button>
                                        )}
                                        {emailOtp.isVerified && (
                                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 whitespace-nowrap px-2">
                                                <CheckCircle2 size={14} /> 인증됨
                                            </span>
                                        )}
                                    </div>

                                    {/* 실시간 중복확인 결과 */}
                                    {isEmailChanged && !emailOtp.codeSent && !emailOtp.isVerified && (
                                        <>
                                            {emailOtp.isChecking && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Loader2 size={12} className="animate-spin" /> 중복 확인 중...
                                                </p>
                                            )}
                                            {emailOtp.isAvailable && (
                                                <p className="text-xs text-emerald-600 flex items-center gap-1">
                                                    <CheckCircle2 size={12} /> 사용 가능한 이메일입니다.
                                                </p>
                                            )}
                                            {emailOtp.isDuplicate && (
                                                <p className="text-xs text-red-500 flex items-center gap-1">
                                                    <XCircle size={12} /> 이미 가입된 이메일입니다.
                                                </p>
                                            )}
                                        </>
                                    )}

                                    {/* OTP 패널 */}
                                    <div className={`transition-all duration-300 overflow-hidden ${
                                        emailOtp.codeSent ? "max-h-56 opacity-100" : "max-h-0 opacity-0"
                                    }`}>
                                        {emailOtp.codeSent && (
                                            <OtpVerificationPanel
                                                targetValue={form.email}
                                                initTimer={300}
                                                timerResetTrigger={emailOtp.otpSent}
                                                onVerify={emailOtp.verifyCode}
                                                onResend={emailOtp.resend}
                                                verifying={emailOtp.verifying}
                                                sendingOtp={emailOtp.sending}
                                                error={emailOtp.verifyError}
                                            />
                                        )}
                                    </div>

                                    {fieldErrors.email && (
                                        <p className="text-xs text-red-500 font-medium">{fieldErrors.email}</p>
                                    )}
                                </div>
                            </div>

                            {/* ── 연락처 ── */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2 sm:gap-4">
                                <label className="text-xs font-bold text-muted-foreground tracking-wide pt-3">
                                    연락처
                                </label>
                                <div className="sm:col-span-2 space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="tel"
                                            value={form.phone}
                                            onChange={(e) => handlePhoneChange(e.target.value)}
                                            placeholder="010-0000-0000"
                                            disabled={phoneOtp.codeSent || phoneOtp.isVerified}
                                            className={`${inputCls} ${
                                                phoneOtp.isVerified   ? "border-emerald-400 bg-emerald-50/30"
                                                    : phoneOtp.isDuplicate ? "border-red-400"
                                                        : phoneOtp.isAvailable ? "border-emerald-300"
                                                            : ""
                                            } ${phoneOtp.codeSent || phoneOtp.isVerified ? "bg-muted/30" : ""}`}
                                        />
                                        {isPhoneChanged && !phoneOtp.codeSent && !phoneOtp.isVerified && (
                                            <button
                                                type="button"
                                                onClick={phoneOtp.sendCode}
                                                disabled={phoneOtp.sending || !phoneOtp.isAvailable}
                                                className={btnSecondaryCls}
                                            >
                                                {phoneOtp.sending ? "발송 중..." : "인증요청"}
                                            </button>
                                        )}
                                        {phoneOtp.isVerified && (
                                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 whitespace-nowrap px-2">
                                                <CheckCircle2 size={14} /> 인증됨
                                            </span>
                                        )}
                                    </div>

                                    {/* 실시간 중복확인 결과 */}
                                    {isPhoneChanged && !phoneOtp.codeSent && !phoneOtp.isVerified && phoneOtp.isValidPhone && (
                                        <>
                                            {phoneOtp.isChecking && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Loader2 size={12} className="animate-spin" /> 번호 확인 중...
                                                </p>
                                            )}
                                            {phoneOtp.isAvailable && (
                                                <p className="text-xs text-emerald-600 flex items-center gap-1">
                                                    <CheckCircle2 size={12} /> 사용 가능한 번호입니다.
                                                </p>
                                            )}
                                            {phoneOtp.isDuplicate && (
                                                <p className="text-xs text-red-500 flex items-center gap-1">
                                                    <XCircle size={12} /> 이미 등록된 번호입니다.
                                                </p>
                                            )}
                                        </>
                                    )}

                                    {/* OTP 패널 */}
                                    <div className={`transition-all duration-300 overflow-hidden ${
                                        phoneOtp.codeSent ? "max-h-56 opacity-100" : "max-h-0 opacity-0"
                                    }`}>
                                        {phoneOtp.codeSent && (
                                            <OtpVerificationPanel
                                                targetValue={form.phone}
                                                initTimer={180}
                                                timerResetTrigger={phoneOtp.otpSent}
                                                onVerify={phoneOtp.verifyCode}
                                                onResend={phoneOtp.resend}
                                                verifying={phoneOtp.verifying}
                                                sendingOtp={phoneOtp.sending}
                                                error={phoneOtp.verifyError}
                                            />
                                        )}
                                    </div>

                                    {fieldErrors.phone && (
                                        <p className="text-xs text-red-500 font-medium">{fieldErrors.phone}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 저장 버튼 */}
                        <div className="pt-4 space-y-4">
                            <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
                                ℹ️ 담당자명, 소속 회사, 사내 직위 등 핵심 회원 정보 변경이 필요하신 경우, 고객센터 혹은 사내 최고 관리자에게 문의해 주세요.
                            </p>
                            <button
                                onClick={handleSave}
                                disabled={isSaveDisabled}
                                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 disabled:opacity-40 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-[0.99]"
                            >
                                {saving ? (
                                    <>
                                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        변경 사항 저장 중...
                                    </>
                                ) : saved
                                    ? "✓ 정상적으로 저장되었습니다"
                                    : "회원 정보 수정 완료"}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 계정 탈퇴 ── */}
            <section className="pt-8 border-t border-border/80">
                <SectionHeader icon={<AlertTriangle size={18} />} title="계정 탈퇴" />
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                    탈퇴 시 해당 기업 소속 계정의 모든 권한 및 활동 내역이 정지되며 복구할 수 없습니다.
                </p>
                {!showDeleteConfirm ? (
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-xs text-red-500/80 hover:text-red-600 font-medium hover:underline transition-colors"
                    >
                        회원 탈퇴 신청하기
                    </button>
                ) : (
                    <div className="bg-red-50/50 border border-red-100 rounded-xl p-5 space-y-4 max-w-xl">
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-red-800">정말로 탈퇴하시겠습니까?</p>
                            <p className="text-xs text-red-600/80 leading-relaxed">
                                이 작업은 즉시 실행되며 되돌릴 수 없습니다. 플랫폼 내 모든 연동 데이터가 영구 자산 삭제 처리됩니다.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleWithdraw}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
                            >
                                네, 탈퇴합니다
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="bg-white border border-border text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}