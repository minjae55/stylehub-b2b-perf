import {type ReactNode, useState} from "react";
import {useNavigate, useSearchParams} from "react-router";
import {AlertCircle, ArrowLeft, ArrowRight, Building2, CheckCircle2, Eye, EyeOff, Tag, User,} from "lucide-react";
import {AgreementCheckbox, CategoryPicker, isValidCategoryCount} from "./Category";

// ── Types ────────────────────────────────────────────────────────────────────

// URL 쿼리 ?role=buyer|seller → EmployeeSignUpRequest.businessRole("BUYER"|"SELLER")로 매핑
type RoleParam = "buyer" | "seller";

// ── FormData — EmployeeSignUpRequest 1:1 매핑 ─────────────────────────────────

interface FormData {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    phone: string;
    businessNumber: string;
    // 조회 결과 표시용 (서버 전송 대상 아님 — 회사 식별은 businessNumber로 이루어짐)
    companyName: string;
    representativeName: string;
    preferredCategoryIds: string[];   // 선택 사항 — 입력 시 3~5개
    agreed: boolean;
}

const STEPS = [
    { num: 1, label: "계정·담당자", icon: <User size={14} /> },
    { num: 2, label: "사업자 확인", icon: <Building2 size={14} /> },
    { num: 3, label: "카테고리",    icon: <Tag size={14} /> },
];

// ── Shared UI ─────────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
    return (
        <div className="flex items-center mb-6">
            {STEPS.map((step, idx) => (
                <div key={step.num} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                            current === step.num
                                ? "bg-primary text-white"
                                : current > step.num
                                    ? "bg-primary/20 text-primary"
                                    : "bg-muted text-muted-foreground"
                        }`}>
                            {current > step.num ? "✓" : step.num}
                        </div>
                        <span className={`text-[10px] whitespace-nowrap ${
                            current === step.num ? "text-primary font-semibold" : "text-muted-foreground"
                        }`}>
                            {step.label}
                        </span>
                    </div>
                    {idx < STEPS.length - 1 && (
                        <div className={`flex-1 h-px mx-2 mb-4 transition-colors ${
                            current > step.num ? "bg-primary/40" : "bg-border"
                        }`} />
                    )}
                </div>
            ))}
        </div>
    );
}

function Field({
                   label, required, hint, children,
               }: {
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

const inputCls =
    "w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors";
const readonlyCls =
    "w-full border border-border rounded px-3 py-2.5 text-sm bg-muted/40 text-muted-foreground cursor-not-allowed";

// ── Step 1: 계정·담당자 ────────────────────────────────────────────────────────

function Step1({form, set}: { form: FormData; set: (f: Partial<FormData>) => void }) {
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const pwMismatch = form.confirmPassword && form.password !== form.confirmPassword;

    return (
        <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2">
                <AlertCircle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                    직원으로 가입하면 <strong>소속 회사 대표자의 승인</strong>을 받은 후 계정이 활성화됩니다.
                </p>
            </div>

            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <User size={14} className="text-primary" /> 계정 정보
            </div>
            <Field label="아이디 (이메일)" required hint="로그인 계정 및 알림 수신 메일로 사용됩니다.">
                <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set({ email: e.target.value })}
                    placeholder="your@company.com"
                    className={inputCls}
                />
            </Field>
            <Field label="비밀번호" required hint="8자 이상">
                <div className="relative">
                    <input
                        type={showPw ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => set({ password: e.target.value })}
                        placeholder="8자 이상"
                        className={`${inputCls} pr-10`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            </Field>
            <Field label="비밀번호 확인" required>
                <div className="relative">
                    <input
                        type={showConfirm ? "text" : "password"}
                        value={form.confirmPassword}
                        onChange={(e) => set({ confirmPassword: e.target.value })}
                        placeholder="비밀번호 재입력"
                        className={`${inputCls} pr-10 ${pwMismatch ? "border-red-400" : ""}`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                {pwMismatch && (
                    <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>
                )}
            </Field>

            <hr className="border-border" />

            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <User size={14} className="text-primary" /> 담당자 정보
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
            <Field label="연락처" required hint="주문·배송 관련 긴급 연락에 사용됩니다.">
                <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set({phone: e.target.value})}
                    placeholder="010-0000-0000"
                    className={inputCls}
                />
            </Field>
        </div>
    );
}

// ── Step 2: 사업자 확인 ────────────────────────────────────────────────────────

function Step2({form, set}: { form: FormData; set: (f: Partial<FormData>) => void }) {
    const [loading, setLoading]   = useState(false);
    const [verified, setVerified] = useState(false);
    const [notFound, setNotFound] = useState(false);

    const handleLookup = () => {
        if (!form.businessNumber) return;
        setLoading(true);
        setNotFound(false);
        // TODO: GET /api/companies?businessNumber=... 로 실제 존재 여부 확인
        // (서버 측 EmployeeSignUpRequest 처리 시 findByBusinessNumber 실패하면 COMPANY_NOT_FOUND)
        setTimeout(() => {
            if (form.businessNumber === "000-00-00000") {
                setNotFound(true);
                set({companyName: "", representativeName: ""});
            } else {
                set({companyName: "(주)패션코리아", representativeName: "홍길동"});
                setVerified(true);
            }
            setLoading(false);
        }, 800);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Building2 size={14} className="text-primary" /> 소속 회사 확인
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
                            setVerified(false);
                            setNotFound(false);
                        }}
                        placeholder="000-00-00000"
                        maxLength={12}
                        className={inputCls}
                    />
                    <button
                        type="button"
                        onClick={handleLookup}
                        disabled={loading || !form.businessNumber || verified}
                        className="shrink-0 px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-semibold rounded transition-colors whitespace-nowrap"
                    >
                        {loading ? "조회 중..." : verified ? "확인됨" : "조회"}
                    </button>
                </div>

                {verified && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                        <CheckCircle2 size={12} /> 사업자 정보가 확인되었습니다.
                    </p>
                )}
                {notFound && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> 등록된 회사를 찾을 수 없습니다. 번호를 다시 확인해 주세요.
                    </p>
                )}
            </Field>

            {verified && (
                <>
                    <Field label="상호명">
                        <input type="text" value={form.companyName} readOnly className={readonlyCls}/>
                    </Field>
                    <Field label="대표자명">
                        <input type="text" value={form.representativeName} readOnly className={readonlyCls}/>
                    </Field>

                    <div className="bg-muted/40 border border-border rounded p-4 space-y-1.5">
                        <p className="text-xs font-semibold text-foreground mb-2">지금까지 입력한 정보</p>
                        {[
                            ["이메일", form.email || "–"],
                            ["이름", form.name || "–"],
                            ["연락처", form.phone || "–"],
                            ["사업자번호", form.businessNumber || "–"],
                            ["소속 회사", form.companyName || "–"],
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

// ── Main component ────────────────────────────────────────────────────────────

export function RegisterEmployee() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const roleParam = (searchParams.get("role") ?? "buyer") as RoleParam;

    const [step, setStep] = useState(1);
    const [form, setForm] = useState<FormData>({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
        phone: "",
        businessNumber: "",
        companyName: "",
        representativeName: "",
        preferredCategoryIds: [],
        agreed: false,
    });
    const set = (partial: Partial<FormData>) =>
        setForm((f) => ({ ...f, ...partial }));

    const canProceed = (): boolean => {
        if (step === 1) {
            return !!(
                form.email && form.password.length >= 8 &&
                form.password === form.confirmPassword &&
                form.name && form.phone
            );
        }
        if (step === 2) {
            return !!(form.businessNumber && form.companyName && form.representativeName);
        }
        if (step === 3) {
            // 카테고리는 선택사항 — 0개 또는 3~5개만 허용
            return isValidCategoryCount(form.preferredCategoryIds.length, false) && form.agreed;
        }
        return false;
    };

    const handleSubmit = () => {
        // TODO: POST /api/users/signup/employee
        // EmployeeSignUpRequest 매핑:
        // { email, password, name, phone, businessNumber,
        //   businessRole: roleParam.toUpperCase() as "BUYER" | "SELLER",
        //   preferredCategoryIds: form.preferredCategoryIds.length > 0 ? form.preferredCategoryIds : undefined }
        navigate("/auth/register/success");
    };

    const roleLabel = roleParam === "buyer" ? "바이어" : "셀러";

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
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-foreground leading-tight">
                        {roleLabel} 회원가입
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        직원 · 가입 후 대표자 승인을 거쳐 계정이 활성화됩니다.
                    </p>
                </div>
            </div>
            <div className="mb-4 mt-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    직원 가입
                </span>
            </div>

            <StepIndicator current={step} />

            {step === 1 && <Step1 form={form} set={set} />}
            {step === 2 && <Step2 form={form} set={set} />}
            {step === 3 && (
                <div className="space-y-4">
                    <CategoryPicker
                        selected={form.preferredCategoryIds}
                        onChange={(ids) => set({preferredCategoryIds: ids})}
                        title="선호 카테고리"
                        description={
                            roleParam === "buyer"
                                ? "주로 구매하는 카테고리를 선택하면 맞춤 상품을 우선 노출해 드립니다."
                                : "주로 취급하는 카테고리를 선택하면 맞춤 바이어를 우선 매칭해 드립니다."
                        }
                        required={false}
                    />
                    <p className="text-xs text-muted-foreground">
                        * 선택하지 않아도 가입 가능합니다. 선택할 경우 3~5개를 골라주세요.
                    </p>
                    <AgreementCheckbox agreed={form.agreed} onAgreedChange={(v) => set({agreed: v})}/>
                </div>
            )}

            <button
                type="button"
                onClick={() => step < 3 ? setStep((s) => s + 1) : handleSubmit()}
                disabled={!canProceed()}
                className="w-full mt-6 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
                {step < 3 ? "다음 단계" : "가입 신청하기"} <ArrowRight size={16} />
            </button>
        </div>
    );
}
