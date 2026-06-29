import {type ReactNode, useEffect, useRef, useState} from "react";
import {Link, useNavigate, useParams} from "react-router";
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Building2,
    CheckCircle2,
    CreditCard,
    Eye,
    EyeOff,
    Globe,
    Store,
    Tag,
    Timer,
    Upload,
    User,
} from "lucide-react";
import {AgreementCheckbox, CategoryPicker, isValidCategoryCount} from "./Category";
import {
    signUpBuyer,
    signUpEmployee,
    uploadBusinessLicenseOcr,
    uploadFile,
    verifyBusinessInvoice
} from "@/api/auth/auth.service";
import api from "@/api/axios";
import {toast} from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = "buyer" | "seller";
type MemberType = "president" | "employee";
type StoreType = "offline" | "online" | "both";

// ── FormData — 모든 역할/유형의 필드를 합산한 슈퍼셋 ──────────────────────────

interface FormData {
    // 공통 (모든 케이스)
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    phone: string;
    businessNumber: string;
    preferredCategoryIds: number[];
    agreed: boolean;

    // 대표자 공통
    companyName: string;
    representativeName: string;
    openDate: string;
    address: string;
    addressDetail: string;
    businessLicenseFile: File | null;

    // 셀러 대표 전용
    websiteUrl: string;
    storeType: StoreType;
    brandName: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    handledCategoryIds: number[];

    // 직원 전용 (조회 후 표시용 — 서버 전송 대상 아님)
    employeeCompanyName: string;
    employeeRepresentativeName: string;
}

// ── 역할/유형별 스텝 정의 ─────────────────────────────────────────────────────

const SELLER_PRESIDENT_STEPS = [
    {num: 1, label: "계정 정보", icon: <User size={14}/>},
    {num: 2, label: "사업자 정보", icon: <Building2 size={14}/>},
    {num: 3, label: "매장 정보", icon: <Store size={14}/>},
    {num: 4, label: "정산 계좌", icon: <CreditCard size={14}/>},
    {num: 5, label: "카테고리", icon: <Tag size={14}/>},
];

const BUYER_PRESIDENT_STEPS = [
    {num: 1, label: "계정 정보", icon: <User size={14}/>},
    {num: 2, label: "사업자 정보", icon: <Building2 size={14}/>},
    {num: 3, label: "카테고리", icon: <Tag size={14}/>},
];

const EMPLOYEE_STEPS = [
    {num: 1, label: "계정·담당자", icon: <User size={14}/>},
    {num: 2, label: "소속 회사 확인", icon: <Building2 size={14}/>},
    {num: 3, label: "카테고리", icon: <Tag size={14}/>},
];

const BANKS = ["국민", "신한", "우리", "하나", "농협", "기업", "카카오뱅크", "토스뱅크", "케이뱅크", "SC제일", "씨티", "기타"];

// ── 공통 Shared UI ────────────────────────────────────────────────────────────

function StepIndicator({current, steps}: { current: number; steps: typeof SELLER_PRESIDENT_STEPS }) {
    return (
        <div className="flex items-center mb-6">
            {steps.map((step, idx) => (
                <div key={step.num} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                current === step.num
                                    ? "bg-primary text-white"
                                    : current > step.num
                                        ? "bg-primary/20 text-primary"
                                        : "bg-muted text-muted-foreground"
                            }`}
                        >
                            {current > step.num ? "✓" : step.num}
                        </div>
                        <span
                            className={`text-[10px] whitespace-nowrap ${
                                current === step.num ? "text-primary font-semibold" : "text-muted-foreground"
                            }`}
                        >
                            {step.label}
                        </span>
                    </div>
                    {idx < steps.length - 1 && (
                        <div
                            className={`flex-1 h-px mx-2 mb-4 transition-colors ${
                                current > step.num ? "bg-primary/40" : "bg-border"
                            }`}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

function Field({label, required, hint, children}: {
    label: string; required?: boolean; hint?: string; children: ReactNode;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-[#333] mb-1.5">
                {label}
                {required && <span className="text-primary ml-1 text-xs">(필수)</span>}
            </label>
            {children}
            {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
        </div>
    );
}

function FileUpload({label, file, onChange}: { label: string; file: File | null; onChange: (f: File) => void }) {
    return (
        <Field label={label}>
            <label
                className="block border-2 border-dashed border-border rounded p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])}
                />
                {file ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium">
                        <Upload size={15}/>
                        {file.name}
                    </div>
                ) : (
                    <>
                        <Upload size={20} className="mx-auto text-muted-foreground mb-1.5"/>
                        <div className="text-sm text-muted-foreground">클릭하여 업로드</div>
                        <div className="text-xs text-muted-foreground mt-0.5">JPG, PNG, PDF · 최대 10MB</div>
                    </>
                )}
            </label>
        </Field>
    );
}

const inputCls = "w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors";
const readonlyCls = "w-full border border-border rounded px-3 py-2.5 text-sm bg-muted/40 text-muted-foreground cursor-not-allowed";

// ── 인증 상태 타입 ────────────────────────────────────────────────────────────

type VerifyStatus = "idle" | "sent" | "verified" | "error";

// ── 이메일 인증 훅 ────────────────────────────────────────────────────────────

function useEmailVerify(email: string) {
    const [status, setStatus] = useState<VerifyStatus>("idle");
    const [code, setCode] = useState("");
    const [inputCode, setInputCode] = useState("");
    const [loading, setLoading] = useState(false);

    const sendCode = async () => {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error("올바른 이메일 주소를 입력해 주세요.");
            return;
        }
        try {
            setLoading(true);
            // TODO: POST /auth/email/send { email }
            await api.post("/auth/email/send", {email});
            setStatus("sent");
            setInputCode("");
            toast.success("인증 코드를 발송했습니다.", {description: `${email}로 6자리 코드를 보냈어요.`});
        } catch (error: any) {
            toast.error("발송 실패", {description: error.message});
        } finally {
            setLoading(false);
        }
    };

    const verifyCode = async () => {
        if (inputCode.length !== 6) {
            toast.error("6자리 코드를 입력해 주세요.");
            return;
        }
        try {
            setLoading(true);
            // TODO: POST /auth/email/verify { email, code }
            await api.post("/auth/email/verify", {email, code: inputCode});
            setStatus("verified");
            toast.success("이메일 인증 완료!");
        } catch (error: any) {
            setStatus("error");
            toast.error("인증 실패", {description: "코드가 올바르지 않거나 만료되었습니다."});
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setStatus("idle");
        setInputCode("");
    };

    return {status, inputCode, setInputCode, loading, sendCode, verifyCode, reset};
}

// ── 휴대폰 인증 훅 (3분 타이머) ──────────────────────────────────────────────

const PHONE_TIMEOUT_SEC = 180;

function usePhoneVerify(phone: string) {
    const [status, setStatus] = useState<VerifyStatus>("idle");
    const [inputCode, setInputCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const clearTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const startTimer = () => {
        clearTimer();
        setTimeLeft(PHONE_TIMEOUT_SEC);
        timerRef.current = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) {
                    clearTimer();
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
    };

    useEffect(() => () => clearTimer(), []);

    const sendCode = async () => {
        const cleaned = phone.replace(/-/g, "");
        if (!/^01[0-9]{8,9}$/.test(cleaned)) {
            toast.error("올바른 휴대폰 번호를 입력해 주세요.");
            return;
        }
        try {
            setLoading(true);
            // TODO: POST /auth/phone/send { phone }  — 백엔드에서 SENS SMS 발송
            await api.post("/auth/phone/send", {phone: cleaned});
            setStatus("sent");
            setInputCode("");
            startTimer();
            toast.success("인증번호를 발송했습니다.", {description: "3분 안에 입력해 주세요."});
        } catch (error: any) {
            toast.error("발송 실패", {description: error.message});
        } finally {
            setLoading(false);
        }
    };

    const verifyCode = async () => {
        if (inputCode.length < 4) {
            toast.error("인증번호를 입력해 주세요.");
            return;
        }
        if (timeLeft === 0) {
            toast.error("인증 시간이 만료되었습니다.", {description: "재발송 버튼을 눌러주세요."});
            return;
        }
        try {
            setLoading(true);
            // TODO: POST /auth/phone/verify { phone, code }
            const cleaned = phone.replace(/-/g, "");
            await api.post("/auth/phone/verify", {phone: cleaned, code: inputCode});
            clearTimer();
            setStatus("verified");
            toast.success("휴대폰 인증 완료!");
        } catch (error: any) {
            toast.error("인증 실패", {description: "번호가 올바르지 않거나 만료되었습니다."});
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (sec: number) => {
        const m = String(Math.floor(sec / 60)).padStart(2, "0");
        const s = String(sec % 60).padStart(2, "0");
        return `${m}:${s}`;
    };

    const reset = () => {
        clearTimer();
        setStatus("idle");
        setInputCode("");
        setTimeLeft(0);
    };

    return {status, inputCode, setInputCode, loading, timeLeft, formatTime, sendCode, verifyCode, reset};
}

// ── Step 1: 계정 정보 (대표자 / 직원 공통) ────────────────────────────────────

interface StepAccountProps {
    form: FormData;
    set: (f: Partial<FormData>) => void;
    isEmailVerified: boolean;
    setIsEmailVerified: (v: boolean) => void;
    isPhoneVerified: boolean;
    setIsPhoneVerified: (v: boolean) => void;
}

function StepAccount({
                         form,
                         set,
                         isEmailVerified,
                         setIsEmailVerified,
                         isPhoneVerified,
                         setIsPhoneVerified
                     }: StepAccountProps) {
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const pwMismatch = form.confirmPassword && form.password !== form.confirmPassword;

    const emailVerify = useEmailVerify(form.email);
    const phoneVerify = usePhoneVerify(form.phone);

    // 인증 완료 시 부모 상태 동기화
    useEffect(() => {
        setIsEmailVerified(emailVerify.status === "verified");
    }, [emailVerify.status]);
    useEffect(() => {
        setIsPhoneVerified(phoneVerify.status === "verified");
    }, [phoneVerify.status]);

    // 이메일 변경 시 인증 초기화
    const handleEmailChange = (v: string) => {
        set({email: v});
        if (emailVerify.status !== "idle") emailVerify.reset();
    };

    // 휴대폰 변경 시 인증 초기화
    const handlePhoneChange = (v: string) => {
        set({phone: v});
        if (phoneVerify.status !== "idle") phoneVerify.reset();
    };

    const codeInputCls = "flex-1 border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors tracking-[0.3em] text-center font-mono placeholder:tracking-normal";

    return (
        <div className="space-y-4">
            {/* ── 계정 정보 ── */}
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <User size={14} className="text-primary"/> 계정 정보
            </div>

            {/* 이메일 + 인증 */}
            <Field label="아이디 (이메일)" required hint={isEmailVerified ? undefined : "가입 후 로그인 및 알림 수신에 사용됩니다."}>
                <div className="flex gap-2">
                    <input
                        type="email"
                        value={form.email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        placeholder="your@company.com"
                        className={`${inputCls} ${isEmailVerified ? "border-emerald-400 bg-emerald-50/40" : ""}`}
                        disabled={isEmailVerified}
                    />
                    <button
                        type="button"
                        onClick={isEmailVerified ? emailVerify.reset : emailVerify.sendCode}
                        disabled={emailVerify.loading || (!isEmailVerified && !form.email)}
                        className={`shrink-0 px-3 py-2.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
                            isEmailVerified
                                ? "bg-muted text-muted-foreground hover:bg-muted/80"
                                : "bg-primary hover:bg-primary/90 disabled:opacity-50 text-white"
                        }`}
                    >
                        {emailVerify.loading ? "발송 중..." : isEmailVerified ? "재인증" : emailVerify.status === "sent" ? "재발송" : "인증코드 발송"}
                    </button>
                </div>

                {/* 코드 입력 — 발송 후 슬라이드 다운 */}
                <div
                    className={`transition-all duration-300 overflow-hidden ${emailVerify.status === "sent" || emailVerify.status === "error" ? "max-h-24 opacity-100 mt-2" : "max-h-0 opacity-0"}`}>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={emailVerify.inputCode}
                            onChange={(e) => emailVerify.setInputCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="6자리 코드"
                            maxLength={6}
                            className={`${codeInputCls} ${emailVerify.status === "error" ? "border-red-400" : ""}`}
                        />
                        <button
                            type="button"
                            onClick={emailVerify.verifyCode}
                            disabled={emailVerify.loading || emailVerify.inputCode.length !== 6}
                            className="shrink-0 px-3 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-xs font-semibold rounded transition-colors"
                        >
                            {emailVerify.loading ? "확인 중..." : "확인"}
                        </button>
                    </div>
                    {emailVerify.status === "error" && (
                        <p className="text-xs text-red-500 mt-1">코드가 올바르지 않습니다. 다시 확인해 주세요.</p>
                    )}
                </div>

                {isEmailVerified && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                        <CheckCircle2 size={12}/> 이메일 인증이 완료되었습니다.
                    </p>
                )}
            </Field>

            {/* 비밀번호 */}
            <Field label="비밀번호">
                <div className="relative">
                    <input
                        type={showPw ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => set({password: e.target.value})}
                        placeholder="비밀번호는 영문, 숫자, 특수문자를 포함하여 8자 이상"
                        className={`${inputCls} pr-10`}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                </div>
            </Field>
            <Field label="비밀번호 확인" required>
                <div className="relative">
                    <input
                        type={showConfirm ? "text" : "password"}
                        value={form.confirmPassword}
                        onChange={(e) => set({confirmPassword: e.target.value})}
                        placeholder="비밀번호 재입력"
                        className={`${inputCls} pr-10 ${pwMismatch ? "border-red-400" : ""}`}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showConfirm ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                </div>
                {pwMismatch && <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>}
            </Field>

            <hr className="border-border"/>

            {/* ── 담당자 정보 ── */}
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <User size={14} className="text-primary"/> 담당자 정보
            </div>

            <Field label="이름" required>
                <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set({name: e.target.value})}
                    placeholder="홍길동"
                    className={inputCls}
                />
            </Field>

            {/* 휴대폰 + 인증 */}
            <Field label="휴대폰 번호" required hint={isPhoneVerified ? undefined : "주문·배송 관련 긴급 연락에 사용됩니다."}>
                <div className="flex gap-2">
                    <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="010-0000-0000"
                        className={`${inputCls} ${isPhoneVerified ? "border-emerald-400 bg-emerald-50/40" : ""}`}
                        disabled={isPhoneVerified}
                    />
                    <button
                        type="button"
                        onClick={isPhoneVerified ? phoneVerify.reset : phoneVerify.sendCode}
                        disabled={phoneVerify.loading || (!isPhoneVerified && !form.phone)}
                        className={`shrink-0 px-3 py-2.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
                            isPhoneVerified
                                ? "bg-muted text-muted-foreground hover:bg-muted/80"
                                : "bg-primary hover:bg-primary/90 disabled:opacity-50 text-white"
                        }`}
                    >
                        {phoneVerify.loading ? "발송 중..." : isPhoneVerified ? "재인증" : phoneVerify.status === "sent" ? "재발송" : "인증번호 발송"}
                    </button>
                </div>

                {/* 인증번호 입력 — 발송 후 슬라이드 다운 */}
                <div
                    className={`transition-all duration-300 overflow-hidden ${phoneVerify.status === "sent" ? "max-h-32 opacity-100 mt-2" : "max-h-0 opacity-0"}`}>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={phoneVerify.inputCode}
                                onChange={(e) => phoneVerify.setInputCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="인증번호 입력"
                                maxLength={6}
                                className={`${codeInputCls} w-full pr-16`}
                            />
                            {/* 타이머 */}
                            {phoneVerify.timeLeft > 0 && (
                                <span
                                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold flex items-center gap-1 ${phoneVerify.timeLeft <= 30 ? "text-red-500" : "text-primary"}`}>
                                    <Timer size={11}/>
                                    {phoneVerify.formatTime(phoneVerify.timeLeft)}
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={phoneVerify.verifyCode}
                            disabled={phoneVerify.loading || phoneVerify.inputCode.length < 4 || phoneVerify.timeLeft === 0}
                            className="shrink-0 px-3 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-xs font-semibold rounded transition-colors"
                        >
                            {phoneVerify.loading ? "확인 중..." : "확인"}
                        </button>
                    </div>
                    {phoneVerify.timeLeft === 0 && phoneVerify.status === "sent" && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle size={11}/> 인증 시간이 만료되었습니다. 재발송 버튼을 눌러주세요.
                        </p>
                    )}
                </div>

                {isPhoneVerified && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                        <CheckCircle2 size={12}/> 휴대폰 인증이 완료되었습니다.
                    </p>
                )}
            </Field>
        </div>
    );
}

// ── Step 2-A: 사업자 정보 — 대표자 (OCR + 국세청 인증) ───────────────────────

interface StepPresidentBusinessProps {
    form: FormData;
    set: (f: Partial<FormData>) => void;
    isBusinessVerified: boolean;
    setIsBusinessVerified: (v: boolean) => void;
    role: Role;
}

function StepPresidentBusiness({
                                   form, set, isBusinessVerified, setIsBusinessVerified, role,
                               }: StepPresidentBusinessProps) {
    const [ocrLoading, setOcrLoading] = useState(false);
    const [lookupLoading, setLookupLoading] = useState(false);

    // 사업자등록증 OCR 자동 인식
    const handleFileChange = async (file: File) => {
        set({businessLicenseFile: file});
        try {
            setOcrLoading(true);
            const data = await uploadBusinessLicenseOcr(file);
            set({
                businessNumber: data.businessNumber || "",
                companyName: data.companyName || "",
                representativeName: data.representativeName || "",
                openDate: data.openDate || "",
            });
            toast.success("사업자 정보가 자동으로 인식되었습니다.", {
                description: "잘못 인식된 부분이 있다면 검토 후 직접 수정해 주세요.",
                duration: 5000,
            });
        } catch (error: any) {
            toast.error(error.message || "글자를 인식하지 못했습니다. 직접 입력해 주세요.");
        } finally {
            setOcrLoading(false);
        }
    };

    // 국세청 4종 진위확인
    const handleLookup = async () => {
        if (!form.businessNumber || !form.companyName || !form.representativeName || !form.openDate) {
            toast.warning("정보 부족", {
                description: "사업자번호, 회사명, 대표자명, 개업일자를 모두 입력해야 조회가 가능합니다.",
            });
            return;
        }
        try {
            setLookupLoading(true);
            await verifyBusinessInvoice({
                businessNumber: form.businessNumber,
                companyName: form.companyName,
                representativeName: form.representativeName,
                openDate: form.openDate,
            });
            setIsBusinessVerified(true);
            toast.success("검증 완료", {
                description: "국세청 사업자 정보 검증 및 계속사업자 확인이 완료되었습니다.",
            });
        } catch (error: any) {
            setIsBusinessVerified(false);
            toast.error("사업자 인증 실패", {
                description: error.message || "국세청 등록 정보와 일치하지 않거나 가입 불가 업종입니다.",
            });
        } finally {
            setLookupLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Building2 size={14} className="text-primary"/> 사업자 정보
            </div>

            <FileUpload
                label={ocrLoading ? "📄 사업자등록증 이미지 분석 중..." : "사업자등록증 이미지"}
                file={form.businessLicenseFile}
                onChange={handleFileChange}
            />

            <Field label="회사명 (법인명)" required hint="국세청에 등록된 정확한 상호를 입력해주세요.">
                <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => set({companyName: e.target.value})}
                    placeholder="(주)스타일허브"
                    className={inputCls}
                    disabled={isBusinessVerified}
                />
            </Field>

            <Field label="대표자명" required>
                <input
                    type="text"
                    value={form.representativeName}
                    onChange={(e) => set({representativeName: e.target.value})}
                    placeholder="홍길동"
                    className={inputCls}
                    disabled={isBusinessVerified}
                />
            </Field>

            <Field label="개업일자" required hint="사업자등록증에 기재된 개업연월일을 선택해주세요.">
                <input
                    type="date"
                    value={form.openDate || ""}
                    onChange={(e) => set({openDate: e.target.value})}
                    className={inputCls}
                    disabled={isBusinessVerified}
                />
            </Field>

            <Field label="사업자등록번호" required>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={form.businessNumber}
                        onChange={(e) => set({businessNumber: e.target.value})}
                        placeholder="000-00-00000"
                        maxLength={12}
                        className={inputCls}
                        disabled={isBusinessVerified}
                    />
                    <button
                        type="button"
                        onClick={handleLookup}
                        disabled={
                            lookupLoading || isBusinessVerified ||
                            !form.businessNumber || !form.companyName ||
                            !form.representativeName || !form.openDate
                        }
                        className="shrink-0 px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-semibold rounded transition-colors whitespace-nowrap"
                    >
                        {lookupLoading ? "조회 중..." : isBusinessVerified ? "인증 완료" : "정보 조회"}
                    </button>
                </div>
                {isBusinessVerified && (
                    <p className="text-xs text-emerald-600 mt-1">
                        ✓ 국세청 및 업종 검증이 완료되었습니다. 이제 다음 단계로 갈 수 있습니다.
                    </p>
                )}
            </Field>

            <Field label="사업장 주소" required>
                <input
                    type="text"
                    value={form.address}
                    onChange={(e) => set({address: e.target.value})}
                    placeholder="시/도 및 도로명 주소"
                    className={`${inputCls} mb-2`}
                />
                <input
                    type="text"
                    value={form.addressDetail}
                    onChange={(e) => set({addressDetail: e.target.value})}
                    placeholder="상세 주소 (동/호수 등)"
                    className={inputCls}
                />
            </Field>

            {/* 셀러만 업종 제한 안내 노출 */}
            {role === "seller" && (
                <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2">
                    <AlertCircle size={14} className="text-amber-600 mt-0.5 shrink-0"/>
                    <p className="text-xs text-amber-700 leading-relaxed">
                        일부 업태·업종은 셀러 가입이 제한됩니다.{" "}
                        <Link to="/restricted-businesses" className="text-amber-800 font-semibold underline">
                            가입 불가 업태/업종 확인하기 →
                        </Link>
                    </p>
                </div>
            )}
        </div>
    );
}

// ── Step 2-B: 소속 회사 확인 — 직원 전용 (DB 조회) ───────────────────────────

interface StepEmployeeBusinessProps {
    form: FormData;
    set: (f: Partial<FormData>) => void;
    isCompanyVerified: boolean;
    setIsCompanyVerified: (v: boolean) => void;
    isCompanyNotFound: boolean;
    setIsCompanyNotFound: (v: boolean) => void;
}

function StepEmployeeBusiness({
                                  form, set,
                                  isCompanyVerified, setIsCompanyVerified,
                                  isCompanyNotFound, setIsCompanyNotFound,
                              }: StepEmployeeBusinessProps) {
    const [loading, setLoading] = useState(false);

    // TODO: GET /api/companies?businessNumber=... — DB에 등록된 회사 조회
    // 회사가 존재하면 verified, 없으면 notFound
    const handleLookup = async () => {
        if (!form.businessNumber) return;
        setLoading(true);
        setIsCompanyNotFound(false);
        setIsCompanyVerified(false);
        try {
            // TODO: 실제 API 연동 후 아래 mock 교체
            // const data = await api.get(`/companies?businessNumber=${form.businessNumber}`);
            // set({ employeeCompanyName: data.companyName, employeeRepresentativeName: data.representativeName });
            await new Promise((r) => setTimeout(r, 800)); // mock 딜레이
            if (form.businessNumber === "000-00-00000") {
                setIsCompanyNotFound(true);
                set({employeeCompanyName: "", employeeRepresentativeName: ""});
                toast.error("회사를 찾을 수 없습니다.", {
                    description: "사업자등록번호를 다시 확인해 주세요.",
                });
            } else {
                // mock 성공
                set({employeeCompanyName: "(주)패션코리아", employeeRepresentativeName: "홍길동"});
                setIsCompanyVerified(true);
                toast.success("회사 확인 완료", {
                    description: "소속 회사 정보가 확인되었습니다. 대표자 승인 후 계정이 활성화됩니다.",
                });
            }
        } catch (error: any) {
            setIsCompanyNotFound(true);
            toast.error(error.message || "회사 조회 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Building2 size={14} className="text-primary"/> 소속 회사 확인
            </div>
            <p className="text-xs text-muted-foreground bg-muted/40 rounded p-3 -mt-1">
                소속 회사의 사업자등록번호를 입력하면 회사 정보가 자동으로 확인됩니다.
                조회 후 대표자가 직접 승인해야 계정이 활성화됩니다.
            </p>

            <Field label="사업자등록번호" required>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={form.businessNumber}
                        onChange={(e) => {
                            set({businessNumber: e.target.value});
                            setIsCompanyVerified(false);
                            setIsCompanyNotFound(false);
                        }}
                        placeholder="000-00-00000"
                        maxLength={12}
                        className={inputCls}
                        disabled={isCompanyVerified}
                    />
                    <button
                        type="button"
                        onClick={handleLookup}
                        disabled={loading || !form.businessNumber || isCompanyVerified}
                        className="shrink-0 px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-semibold rounded transition-colors whitespace-nowrap"
                    >
                        {loading ? "조회 중..." : isCompanyVerified ? "확인됨" : "조회"}
                    </button>
                </div>
                {isCompanyVerified && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                        <CheckCircle2 size={12}/> 사업자 정보가 확인되었습니다.
                    </p>
                )}
                {isCompanyNotFound && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={12}/> 등록된 회사를 찾을 수 없습니다. 번호를 다시 확인해 주세요.
                    </p>
                )}
            </Field>

            {isCompanyVerified && (
                <>
                    <Field label="상호명">
                        <input type="text" value={form.employeeCompanyName} readOnly className={readonlyCls}/>
                    </Field>
                    <Field label="대표자명">
                        <input type="text" value={form.employeeRepresentativeName} readOnly className={readonlyCls}/>
                    </Field>

                    <div className="bg-muted/40 border border-border rounded p-4 space-y-1.5">
                        <p className="text-xs font-semibold text-foreground mb-2">지금까지 입력한 정보</p>
                        {[
                            ["이메일", form.email || "–"],
                            ["이름", form.name || "–"],
                            ["연락처", form.phone || "–"],
                            ["사업자번호", form.businessNumber || "–"],
                            ["소속 회사", form.employeeCompanyName || "–"],
                        ].map(([k, v]) => (
                            <div key={k} className="flex justify-between text-xs">
                                <span className="text-muted-foreground">{k}</span>
                                <span className="text-foreground font-medium truncate max-w-[55%] text-right">{v}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ── Step 3: 매장 정보 — 셀러 대표 전용 ───────────────────────────────────────

function StepStore({form, set}: { form: FormData; set: (f: Partial<FormData>) => void }) {
    const storeOpts: { value: StoreType; label: string; icon: ReactNode }[] = [
        {value: "offline", label: "오프라인", icon: <Store size={16}/>},
        {value: "online", label: "온라인", icon: <Globe size={16}/>},
        {value: "both", label: "온·오프라인", icon: <><Store size={13}/><Globe size={13}/></>},
    ];
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Store size={14} className="text-primary"/> 매장 정보
            </div>
            <Field label="브랜드명">
                <input
                    type="text"
                    value={form.brandName}
                    onChange={(e) => set({brandName: e.target.value})}
                    placeholder="대표 브랜드 (선택)"
                    className={inputCls}
                />
            </Field>
            <Field label="매장 타입" required>
                <div className="grid grid-cols-3 gap-2">
                    {storeOpts.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => set({storeType: opt.value})}
                            className={`flex flex-col items-center gap-2 border-2 rounded px-2 py-3 text-xs font-medium transition-all ${
                                form.storeType === opt.value
                                    ? "border-primary bg-secondary text-primary"
                                    : "border-border text-muted-foreground hover:border-primary/40"
                            }`}
                        >
                            <span className="flex gap-0.5">{opt.icon}</span>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </Field>
            {(form.storeType === "online" || form.storeType === "both") && (
                <Field label="쇼핑몰 URL" required hint="네이버 스마트스토어, 쿠팡, 자체몰 URL 등">
                    <input
                        type="url"
                        value={form.websiteUrl}
                        onChange={(e) => set({websiteUrl: e.target.value})}
                        placeholder="https://smartstore.naver.com/mystore"
                        className={inputCls}
                    />
                </Field>
            )}
        </div>
    );
}

// ── Step 4: 정산 계좌 — 셀러 대표 전용 ───────────────────────────────────────

function StepBankAccount({form, set}: { form: FormData; set: (f: Partial<FormData>) => void }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <CreditCard size={14} className="text-primary"/> 정산 계좌 정보
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
                바이어 결제 대금 정산을 위한 계좌입니다. 가입 후에도 변경할 수 있습니다.
            </p>
            <Field label="은행명" required>
                <select
                    value={form.bankName}
                    onChange={(e) => set({bankName: e.target.value})}
                    className={inputCls}
                >
                    <option value="">은행 선택</option>
                    {BANKS.map((b) => (
                        <option key={b} value={b}>{b}은행</option>
                    ))}
                </select>
            </Field>
            <Field label="계좌번호" required>
                <input
                    type="text"
                    value={form.accountNumber}
                    onChange={(e) => set({accountNumber: e.target.value})}
                    placeholder="숫자만 입력"
                    className={inputCls}
                />
            </Field>
            <Field label="예금주명" required>
                <input
                    type="text"
                    value={form.accountHolder}
                    onChange={(e) => set({accountHolder: e.target.value})}
                    placeholder="예금주 이름"
                    className={inputCls}
                />
            </Field>

            <div className="bg-muted/40 border border-border rounded p-4 space-y-1.5">
                <p className="text-xs font-semibold text-foreground mb-2">지금까지 입력한 정보</p>
                {[
                    ["사업자번호", form.businessNumber || "–"],
                    ["회사명", form.companyName || "–"],
                    ["브랜드명", form.brandName || "–"],
                    ["매장 타입", form.storeType === "offline" ? "오프라인" : form.storeType === "online" ? "온라인" : "온·오프라인"],
                    ["정산계좌", form.bankName && form.accountNumber ? `${form.bankName}은행 ${form.accountNumber}` : "–"],
                ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="text-foreground font-medium truncate max-w-[55%] text-right">{v}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Step: 카테고리 — 역할별 분기 ──────────────────────────────────────────────

interface StepCategoryProps {
    form: FormData;
    set: (f: Partial<FormData>) => void;
    role: Role;
    memberType: MemberType;
}

function StepCategory({form, set, role, memberType}: StepCategoryProps) {
    const isEmployee = memberType === "employee";
    const isSellerPresident = role === "seller" && memberType === "president";

    return (
        <div className="space-y-6">
            <CategoryPicker
                selected={form.preferredCategoryIds}
                onChange={(ids) => set({preferredCategoryIds: ids})}
                title="선호 카테고리"
                description={
                    role === "buyer"
                        ? "주로 구매하는 카테고리를 선택하면 맞춤 상품을 우선 노출해 드립니다."
                        : "평소 관심 있는 카테고리를 선택하면 맞춤 소싱 요청을 우선 받아보실 수 있습니다."
                }
                required={!isEmployee}
            />

            {/* 직원은 선택 선택사항 안내 */}
            {isEmployee && (
                <p className="text-xs text-muted-foreground -mt-2">
                    * 선택하지 않아도 가입 가능합니다. 선택할 경우 3~5개를 골라주세요.
                </p>
            )}

            {/* 셀러 대표만 취급 카테고리 추가 노출 */}
            {isSellerPresident && (
                <>
                    <hr className="border-border"/>
                    <CategoryPicker
                        selected={form.handledCategoryIds}
                        onChange={(ids) => set({handledCategoryIds: ids})}
                        title="회사 취급 카테고리"
                        description="우리 회사가 실제로 공급하는 카테고리를 선택하면 맞춤 바이어에게 우선 매칭됩니다."
                        required
                    />
                </>
            )}

            <AgreementCheckbox agreed={form.agreed} onAgreedChange={(v) => set({agreed: v})}/>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export function Register() {
    const navigate = useNavigate();
    const {role, memberType} = useParams<{ role: Role; memberType: MemberType }>();

    const resolvedRole: Role = role ?? "buyer";
    const resolvedMemberType: MemberType = memberType ?? "president";

    const isEmployee = resolvedMemberType === "employee";
    const isSellerPresident = resolvedRole === "seller" && resolvedMemberType === "president";
    const isBuyerPresident = resolvedRole === "buyer" && resolvedMemberType === "president";

    const steps = isEmployee
        ? EMPLOYEE_STEPS
        : isBuyerPresident
            ? BUYER_PRESIDENT_STEPS
            : SELLER_PRESIDENT_STEPS;

    const totalSteps = steps.length;

    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 대표자 — 국세청 사업자 인증 상태
    const [isBusinessVerified, setIsBusinessVerified] = useState(false);

    // 직원 — 소속 회사 DB 조회 상태
    const [isCompanyVerified, setIsCompanyVerified] = useState(false);
    const [isCompanyNotFound, setIsCompanyNotFound] = useState(false);

    // Step1 — 이메일 / 휴대폰 인증 상태
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);

    const [form, setForm] = useState<FormData>({
        email: "", password: "", confirmPassword: "",
        name: "", phone: "",
        businessNumber: "",
        preferredCategoryIds: [],
        agreed: false,
        // 대표자 공통
        companyName: "", representativeName: "", openDate: "",
        address: "", addressDetail: "", businessLicenseFile: null,
        // 셀러 대표 전용
        websiteUrl: "", storeType: "online", brandName: "",
        bankName: "", accountNumber: "", accountHolder: "",
        handledCategoryIds: [],
        // 직원 전용
        employeeCompanyName: "", employeeRepresentativeName: "",
    });

    const set = (partial: Partial<FormData>) => {
        setForm((f) => ({...f, ...partial}));
        // 대표자: 사업자 정보 변경 시 인증 초기화
        if (!isEmployee &&
            (partial.businessNumber || partial.companyName || partial.representativeName || partial.openDate)) {
            setIsBusinessVerified(false);
        }
    };

    // ── 스텝별 다음 진행 가능 여부 ────────────────────────────────────────────

    const canProceed = (): boolean => {
        // Step 1: 계정 정보 (공통)
        if (step === 1) {
            return !!(
                form.email &&
                form.password.length >= 8 &&
                form.password === form.confirmPassword &&
                form.name &&
                form.phone &&
                isEmailVerified &&
                isPhoneVerified
            );
        }

        // Step 2: 사업자/소속 회사 확인
        if (step === 2) {
            if (isEmployee) {
                // 직원: DB에서 회사 조회 완료 필수
                return !!(form.businessNumber && form.employeeCompanyName && isCompanyVerified);
            }
            // 대표자 공통: OCR + 국세청 인증 완료 필수
            return !!(
                form.businessNumber && form.companyName &&
                form.representativeName && form.openDate &&
                form.address && form.businessLicenseFile && isBusinessVerified
            );
        }

        // Step 3: 셀러 대표 — 매장 정보
        if (isSellerPresident && step === 3) {
            return !!(form.storeType && (form.storeType === "offline" || form.websiteUrl));
        }

        // Step 4: 셀러 대표 — 정산 계좌
        if (isSellerPresident && step === 4) {
            return !!(form.bankName && form.accountNumber && form.accountHolder);
        }

        // 마지막 스텝: 카테고리
        if (step === totalSteps) {
            if (isEmployee) {
                // 직원: 선택사항 (0개 또는 3~5개)
                return isValidCategoryCount(form.preferredCategoryIds.length, false) && form.agreed;
            }
            if (isSellerPresident) {
                // 셀러 대표: 선호 + 취급 카테고리 모두 필수
                return (
                    isValidCategoryCount(form.preferredCategoryIds.length, true) &&
                    isValidCategoryCount(form.handledCategoryIds.length, true) &&
                    form.agreed
                );
            }
            // 바이어 대표: 선호 카테고리만 필수
            return isValidCategoryCount(form.preferredCategoryIds.length, true) && form.agreed;
        }

        return false;
    };

    // ── 최종 제출 ─────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);

            if (isEmployee) {
                // 직원 가입
                const cleanBusinessNumber = form.businessNumber.replace(/-/g, "");
                await signUpEmployee({
                    email: form.email,
                    password: form.password,
                    name: form.name,
                    phone: form.phone,
                    businessNumber: cleanBusinessNumber,
                    businessRole: resolvedRole.toUpperCase() as "BUYER" | "SELLER",
                    preferredCategoryIds:
                        form.preferredCategoryIds.length > 0 ? form.preferredCategoryIds : undefined,
                });
                toast.success("가입 신청 완료!", {
                    description: `${resolvedRole === "buyer" ? "바이어" : "셀러"} 직원 가입 신청이 접수되었습니다. 대표자 승인 후 로그인 가능합니다.`,
                });

            } else if (isBuyerPresident) {
                // 바이어 대표 가입
                if (!form.businessLicenseFile) {
                    toast.error("가입 신청 실패", {description: "사업자등록증 파일을 올려주세요."});
                    return;
                }
                const licenseUrl = await uploadFile(form.businessLicenseFile);
                const cleanBusinessNumber = form.businessNumber.replace(/-/g, "");
                await signUpBuyer({
                    email: form.email,
                    password: form.password,
                    name: form.name,
                    phone: form.phone,
                    businessNumber: cleanBusinessNumber,
                    companyName: form.companyName,
                    representativeName: form.representativeName,
                    address: form.address,
                    addressDetail: form.addressDetail,
                    businessLicenseUrl: licenseUrl,
                    preferredCategoryIds: form.preferredCategoryIds,
                });
                toast.success("가입 완료!", {description: "바이어 가입 신청이 정상적으로 접수되었습니다."});

            } else {
                // 셀러 대표 가입
                if (!form.businessLicenseFile) {
                    toast.error("가입 신청 실패", {description: "사업자등록증 파일을 올려주세요."});
                    return;
                }
                const licenseUrl = await uploadFile(form.businessLicenseFile);
                const cleanBusinessNumber = form.businessNumber.replace(/-/g, "");
                await api.post("/auth/register/seller", {
                    email: form.email,
                    password: form.password,
                    name: form.name,
                    phone: form.phone,
                    businessNumber: cleanBusinessNumber,
                    companyName: form.companyName,
                    representativeName: form.representativeName,
                    address: form.address,
                    addressDetail: form.addressDetail,
                    businessLicenseUrl: licenseUrl,
                    websiteUrl: form.websiteUrl,
                    storeType: form.storeType.toUpperCase() as "OFFLINE" | "ONLINE" | "BOTH",
                    brandName: form.brandName,
                    bankName: form.bankName,
                    accountNumber: form.accountNumber,
                    accountHolder: form.accountHolder,
                    preferredCategoryIds: form.preferredCategoryIds,
                    handledCategoryIds: form.handledCategoryIds,
                });
                toast.success("가입 완료!", {description: "셀러 가입 신청이 정상적으로 접수되었습니다."});
            }

            navigate("/auth/register/success");

        } catch (error: any) {
            console.error("회원가입 에러:", error);
            toast.error("가입 신청 실패", {description: error.message});
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── 헤더 텍스트 ───────────────────────────────────────────────────────────

    const roleLabel = resolvedRole === "buyer" ? "바이어" : "셀러";
    const memberLabel = isEmployee ? "직원" : "대표자";
    const badgeColor = isEmployee
        ? "bg-amber-100 text-amber-700"
        : "bg-primary/10 text-primary";

    return (
        <div>
            <div className="flex items-center gap-3 mb-1">
                <button
                    type="button"
                    onClick={() =>
                        step === 1 ? navigate("/auth/register") : setStep((s) => s - 1)
                    }
                    className="text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft size={18}/>
                </button>
                <div>
                    <h2 className="text-xl font-bold text-foreground leading-tight">
                        {roleLabel} 회원가입
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        가입 후 담당자 확인을 거쳐 계정이 활성화됩니다.
                    </p>
                </div>
            </div>
            <div className="mb-4 mt-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>
                    {memberLabel} 가입
                </span>
            </div>

            <StepIndicator current={step} steps={steps}/>

            {/* ── Step 렌더링 ── */}

            {/* Step 1: 계정 정보 (공통) */}
            {step === 1 && (
                <StepAccount
                    form={form}
                    set={set}
                    isEmailVerified={isEmailVerified}
                    setIsEmailVerified={setIsEmailVerified}
                    isPhoneVerified={isPhoneVerified}
                    setIsPhoneVerified={setIsPhoneVerified}
                />
            )}

            {/* Step 2: 사업자 정보 (대표자) / 소속 회사 확인 (직원) */}
            {step === 2 && isEmployee && (
                <StepEmployeeBusiness
                    form={form}
                    set={set}
                    isCompanyVerified={isCompanyVerified}
                    setIsCompanyVerified={setIsCompanyVerified}
                    isCompanyNotFound={isCompanyNotFound}
                    setIsCompanyNotFound={setIsCompanyNotFound}
                />
            )}
            {step === 2 && !isEmployee && (
                <StepPresidentBusiness
                    form={form}
                    set={set}
                    isBusinessVerified={isBusinessVerified}
                    setIsBusinessVerified={setIsBusinessVerified}
                    role={resolvedRole}
                />
            )}

            {/* Step 3: 셀러 대표 — 매장 정보 */}
            {step === 3 && isSellerPresident && <StepStore form={form} set={set}/>}

            {/* Step 4: 셀러 대표 — 정산 계좌 */}
            {step === 4 && isSellerPresident && <StepBankAccount form={form} set={set}/>}

            {/* 마지막 스텝: 카테고리 */}
            {step === totalSteps && (
                <StepCategory
                    form={form}
                    set={set}
                    role={resolvedRole}
                    memberType={resolvedMemberType}
                />
            )}

            <button
                type="button"
                onClick={() => (step < totalSteps ? setStep((s) => s + 1) : handleSubmit())}
                disabled={!canProceed() || isSubmitting}
                className="w-full mt-6 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
                {step < totalSteps
                    ? "다음 단계"
                    : isSubmitting
                        ? "가입 신청 중..."
                        : "가입 신청하기"}{" "}
                <ArrowRight size={16}/>
            </button>
        </div>
    );
}