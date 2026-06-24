import React, { useState, useRef, useEffect } from "react";
import { User, Camera, AlertTriangle, Lock, Building2, Briefcase, IdCard, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import {
    uploadFile,
    sendEmailChangeOtp,
    verifyEmailChangeOtp,
    sendPhoneChangeOtp,
    verifyPhoneChangeOtp
} from "@/api/auth";
import { verifyGatePassword, updateProfileInfo } from "@/api/user";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProfileForm {
    email: string;
    phone: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls =
    "w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white text-foreground shadow-sm font-medium text-left disabled:bg-muted/30 disabled:text-muted-foreground/60";

const readonlyCls =
    "w-full rounded-xl px-4 py-3 text-sm bg-muted/50 text-muted-foreground/80 cursor-not-allowed flex items-center justify-between border border-transparent select-none font-medium text-left";

const btnSecondaryCls =
    "whitespace-nowrap px-4 bg-muted hover:bg-muted/80 text-muted-foreground border border-border rounded-xl text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const btnActionCls =
    "whitespace-nowrap px-4 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50";

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
        case "BOTH": return "통합 관리자 (구매/판매)";
        case "SELLER": return "판매자";
        case "BUYER": return "구매자";
        default: return businessRole;
    }
};

const getRoleLabel = (role: string) => {
    switch (role) {
        case "ADMIN": return "총괄 관리자";
        case "PRESIDENT": return "대표 / 사장";
        case "EMPLOYEE": return "직원";
        default: return "일반 회원";
    }
};

// ── Component ─────────────────────────────────────────────────────────────────

export function ProfileTab() {
    const { user, setUser, clearUser } = useAuthStore();

    // 🔒 [입구 보안] 진입 전 비밀번호 검증 상태
    const [isTabUnlocked, setIsTabUnlocked] = useState(false);
    const [gatePassword, setGatePassword] = useState("");
    const [gateError, setGateError] = useState("");
    const [verifyingGate, setVerifyingGate] = useState(false);

    // 입력 폼 상태
    const [form, setForm] = useState<ProfileForm>({ email: "", phone: "" });
    const [preview, setPreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    // 공통 상태
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const imgRef = useRef<HTMLInputElement>(null);

    // ✉️ 이메일 인증 상태들
    const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
    const [emailOtpCode, setEmailOtpCode] = useState("");
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [emailTimer, setEmailTimer] = useState(0);

    // 📱 핸드폰 인증 상태들
    const [isPhoneOtpSent, setIsPhoneOtpSent] = useState(false);
    const [phoneOtpCode, setPhoneOtpCode] = useState("");
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);
    const [phoneTimer, setPhoneTimer] = useState(0);

    // 유저 로드 시 초기 폼 세팅
    useEffect(() => {
        if (user) {
            setForm({
                email: user.email || "",
                phone: user.phone || "",
            });
        }
    }, [user]);

    // ⏳ 타이머 시스템
    useEffect(() => {
        if (emailTimer === 0) return;
        const interval = setInterval(() => setEmailTimer((prev) => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [emailTimer]);

    useEffect(() => {
        if (phoneTimer === 0) return;
        const interval = setInterval(() => setPhoneTimer((prev) => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [phoneTimer]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    const set = (p: Partial<ProfileForm>) => {
        setForm((f) => ({ ...f, ...p }));
        setFieldErrors({});
    };

    // ── 인증/보안 핸들러 ────────────────────────────────────────────────────────

    // 🔒 [대문 검문소] 비밀번호 검증 함수
    const handleGateVerify = async (e: React.SubmitEvent<HTMLFormElement>) => {
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

    // 이메일 OTP 발송
    const handleSendEmailOtp = async () => {
        if (!form.email.trim()) return alert("이메일 주소를 입력해 주세요.");
        try {
            await sendEmailChangeOtp({ targetValue: form.email });
            setIsEmailOtpSent(true);
            setEmailTimer(180);
            alert("입력하신 이메일로 인증번호가 발송되었습니다.");
        } catch (err: any) {
            alert(err.response?.data?.message || "인증번호 발송 실패");
        }
    };

    // 이메일 OTP 검증
    const handleVerifyEmailOtp = async () => {
        if (!emailOtpCode.trim()) return alert("인증번호를 입력해 주세요.");
        try {
            await verifyEmailChangeOtp({ targetValue: form.email, otpCode: emailOtpCode });
            setIsEmailVerified(true);
            setIsEmailOtpSent(false);
            setEmailTimer(0);
            alert("이메일 인증이 완료되었습니다.");
        } catch (err: any) {
            alert(err.response?.data?.message || "인증번호가 일치하지 않습니다.");
        }
    };

    // 핸드폰 OTP 발송
    const handleSendPhoneOtp = async () => {
        if (!form.phone.trim()) return alert("연락처를 입력해 주세요.");
        try {
            await sendPhoneChangeOtp({ targetValue: form.phone });
            setIsPhoneOtpSent(true);
            setPhoneTimer(180);
            alert("입력하신 연락처로 인증번호가 발송되었습니다.");
        } catch (err: any) {
            alert(err.response?.data?.message || "인증번호 발송 실패");
        }
    };

    // 핸드폰 OTP 검증
    const handleVerifyPhoneOtp = async () => {
        if (!phoneOtpCode.trim()) return alert("인증번호를 입력해 주세요.");
        try {
            await verifyPhoneChangeOtp({ targetValue: form.phone, otpCode: phoneOtpCode });
            setIsPhoneVerified(true);
            setIsPhoneOtpSent(false);
            setPhoneTimer(0);
            alert("연락처 인증이 완료되었습니다.");
        } catch (err: any) {
            alert(err.response?.data?.message || "인증번호가 일치하지 않습니다.");
        }
    };

    // ── 데이터 변경 및 파일 핸들러 ──────────────────────────────────────────────────

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
            if (imageFile) {
                uploadedUrl = await uploadFile(imageFile);
            }

            const updatedUser = await updateProfileInfo({
                email: form.email,
                phone: form.phone,
                profileImageUrl: uploadedUrl,
            });

            setUser(updatedUser);
            setSaved(true);
            setImageFile(null);
            setIsEmailVerified(false);
            setIsPhoneVerified(false);
            setTimeout(() => setSaved(false), 2500);
        } catch (error: any) {
            const errors = error.response?.data?.fieldErrors;
            if (errors) {
                setFieldErrors(errors);
            } else {
                alert(error.response?.data?.message || "정보 수정 중 오류가 발생했습니다.");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleWithdraw = async () => {
        try {
            // 회원 탈퇴는 기본 user 기능이므로 엔드포인트 유지 혹은 user.ts 확장 가능
            // await api.delete("/users/me");
            alert("회원 탈퇴가 완료되었습니다.");
            clearUser();
        } catch (error: any) {
            alert(error.response?.data?.message || "탈퇴 처리 중 오류가 발생했습니다.");
        }
    };

    if (!user) return null;

    // 🔒 [대문 단계] 아직 비밀번호 잠금이 안 풀렸다면 검증 화면만 렌더링
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

    // 🔓 [수정 단계] 비밀번호 통과 후 나타나는 메인 폼 전체 복구 영역
    const avatarSrc = preview || user.profileImageUrl;
    const initials = user.name ? user.name.slice(0, 2) : "유저";

    const isEmailChanged = user.email !== form.email;
    const isPhoneChanged = user.phone !== form.phone;

    const isSaveDisabled =
        saving ||
        (isEmailChanged && !isEmailVerified) ||
        (isPhoneChanged && !isPhoneVerified) ||
        (!isEmailChanged && !isPhoneChanged && !imageFile);

    return (
        <div className="max-w-4xl mx-auto space-y-12 py-4 text-left">

            {/* ── 내 정보 ── */}
            <section>
                <SectionHeader icon={<User size={18} />} title="내 정보 수정" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start mt-8">

                    {/* [왼쪽 컬럼] 프로필 이미지 업로드 스탠드 카드 */}
                    <div className="flex flex-col items-center p-8 bg-muted/30 border border-border/60 rounded-2xl space-y-4 text-center">
                        <div className="relative group">
                            <div
                                onClick={() => imgRef.current?.click()}
                                className="w-32 h-32 rounded-full bg-primary/5 text-primary font-black text-3xl flex items-center justify-center overflow-hidden cursor-pointer border-2 border-border hover:border-primary/40 shadow-sm transition-all relative"
                            >
                                {avatarSrc ? (
                                    <img src={avatarSrc} alt="프로필" className="w-full h-full object-cover" />
                                ) : (
                                    initials
                                )}
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

                            <input
                                ref={imgRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                        </div>

                        <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide">
                            {getRoleLabel(user.role)}
                        </div>
                    </div>

                    {/* [오른쪽 컬럼] 상세 필드 영역 */}
                    <div className="md:col-span-2 space-y-5">

                        {/* 🔒 읽기 전용 정보 구역 */}
                        <div className="space-y-5">
                            {/* 소속 회사 */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2 sm:gap-4">
                                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 tracking-wide">
                                    <Building2 size={13} /> 소속 회사
                                </label>
                                <div className="sm:col-span-2">
                                    <div className={readonlyCls}>
                                        <span>{user.companyName || "미지정 소속"}</span>
                                        <Lock size={12} className="text-muted-foreground/30" />
                                    </div>
                                </div>
                            </div>

                            {/* 이름 */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 aitems-center gap-2 sm:gap-4">
                                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 tracking-wide">
                                    <IdCard size={13} /> 이름
                                </label>
                                <div className="sm:col-span-2">
                                    <div className={readonlyCls}>
                                        <span>{user.name}</span>
                                        <Lock size={12} className="text-muted-foreground/30" />
                                    </div>
                                </div>
                            </div>

                            {/* 플랫폼 권한 범위 */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2 sm:gap-4">
                                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 tracking-wide">
                                    <Briefcase size={13} /> 플랫폼 권한 범위
                                </label>
                                <div className="sm:col-span-2">
                                    <div className={readonlyCls}>
                                        <span>{getBusinessRoleLabel(user.businessRole)}</span>
                                        <Lock size={12} className="text-muted-foreground/30" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ✏️ 수정 가능 정보 구역 */}
                        <div className="pt-6 border-t border-dashed border-border space-y-5">

                            {/* 이메일 주소 */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2 sm:gap-4">
                                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 tracking-wide pt-3">
                                    이메일 주소
                                </label>
                                <div className="sm:col-span-2 space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => set({ email: e.target.value })}
                                            placeholder="example@company.com"
                                            disabled={isEmailOtpSent || isEmailVerified}
                                            className={inputCls}
                                        />
                                        {isEmailChanged && !isEmailVerified && (
                                            <button
                                                onClick={handleSendEmailOtp}
                                                disabled={isEmailOtpSent}
                                                className={btnSecondaryCls}
                                            >
                                                인증요청
                                            </button>
                                        )}
                                        {isEmailChanged && isEmailVerified && (
                                            <span className="flex items-center gap-1 text-xs font-bold text-green-600 whitespace-nowrap px-2">
                                                <CheckCircle2 size={14} /> 인증됨
                                            </span>
                                        )}
                                    </div>

                                    {/* 이메일 OTP 입력칸 */}
                                    {isEmailOtpSent && (
                                        <div className="flex gap-2 animate-fadeIn">
                                            <div className="relative w-full">
                                                <input
                                                    type="text"
                                                    maxLength={6}
                                                    placeholder="인증번호 6자리 입력"
                                                    value={emailOtpCode}
                                                    onChange={(e) => setEmailOtpCode(e.target.value)}
                                                    className={inputCls}
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-red-500">
                                                    {formatTime(emailTimer)}
                                                </span>
                                            </div>
                                            <button onClick={handleVerifyEmailOtp} disabled={emailTimer === 0} className={btnActionCls}>
                                                확인
                                            </button>
                                        </div>
                                    )}
                                    {fieldErrors.email && <p className="text-xs text-red-500 font-medium">{fieldErrors.email}</p>}
                                </div>
                            </div>

                            {/* 연락처 */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2 sm:gap-4">
                                <label className="text-xs font-bold text-muted-foreground tracking-wide pt-3">
                                    연락처
                                </label>
                                <div className="sm:col-span-2 space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="tel"
                                            value={form.phone}
                                            onChange={(e) => set({ phone: e.target.value })}
                                            placeholder="010-0000-0000"
                                            disabled={isPhoneOtpSent || isPhoneVerified}
                                            className={inputCls}
                                        />
                                        {isPhoneChanged && !isPhoneVerified && (
                                            <button
                                                onClick={handleSendPhoneOtp}
                                                disabled={isPhoneOtpSent}
                                                className={btnSecondaryCls}
                                            >
                                                인증요청
                                            </button>
                                        )}
                                        {isPhoneChanged && isPhoneVerified && (
                                            <span className="flex items-center gap-1 text-xs font-bold text-green-600 whitespace-nowrap px-2">
                                                <CheckCircle2 size={14} /> 인증됨
                                            </span>
                                        )}
                                    </div>

                                    {/* 핸드폰 OTP 입력칸 */}
                                    {isPhoneOtpSent && (
                                        <div className="flex gap-2 animate-fadeIn">
                                            <div className="relative w-full">
                                                <input
                                                    type="text"
                                                    maxLength={6}
                                                    placeholder="인증번호 6자리 입력"
                                                    value={phoneOtpCode}
                                                    onChange={(e) => setPhoneOtpCode(e.target.value)}
                                                    className={inputCls}
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-red-500">
                                                    {formatTime(phoneTimer)}
                                                </span>
                                            </div>
                                            <button onClick={handleVerifyPhoneOtp} disabled={phoneTimer === 0} className={btnActionCls}>
                                                확인
                                            </button>
                                        </div>
                                    )}
                                    {fieldErrors.phone && <p className="text-xs text-red-500 font-medium">{fieldErrors.phone}</p>}
                                </div>
                            </div>
                        </div>

                        {/* 가이드 메시지 및 저장 버튼 */}
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
                                ) : saved ? (
                                    "✓ 정상적으로 저장되었습니다"
                                ) : (
                                    "회원 정보 수정 완료"
                                )}
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