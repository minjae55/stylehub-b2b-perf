import { useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Upload, User, Building2, MapPin, AlertCircle, Tag } from "lucide-react";
import { CategoryStep } from "./Category";

type MemberType = "ceo" | "employee";

interface FormData {
    email: string; password: string; confirmPassword: string;
    managerName: string; managerPhone: string;
    delegationDoc: File | null; employmentDoc: File | null;
    businessNo: string; companyName: string; ceoName: string; businessLicense: File | null;
    addressMain: string; addressDetail: string;
    preferredCategories: string[];
    agreed: boolean;
}

const STEPS = [
    { num: 1, label: "계정·담당자", icon: <User size={14} /> },
    { num: 2, label: "사업자 정보", icon: <Building2 size={14} /> },
    { num: 3, label: "배송지",      icon: <MapPin size={14} /> },
    { num: 4, label: "카테고리",    icon: <Tag size={14} /> },
];

function StepIndicator({ current }: { current: number }) {
    return (
        <div className="flex items-center mb-6">
            {STEPS.map((step, idx) => (
                <div key={step.num} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                            current === step.num ? "bg-primary text-white"
                                : current > step.num ? "bg-primary/20 text-primary"
                                    : "bg-muted text-muted-foreground"
                        }`}>
                            {current > step.num ? "✓" : step.num}
                        </div>
                        <span className={`text-[10px] whitespace-nowrap ${current === step.num ? "text-primary font-semibold" : "text-muted-foreground"}`}>
              {step.label}
            </span>
                    </div>
                    {idx < STEPS.length - 1 && (
                        <div className={`flex-1 h-px mx-2 mb-4 transition-colors ${current > step.num ? "bg-primary/40" : "bg-border"}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
    return (
        <div>
            <label className="block text-sm font-medium text-[#333] mb-1.5">
                {label}{required && <span className="text-primary ml-1 text-xs">(필수)</span>}
            </label>
            {children}
            {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
        </div>
    );
}

function FileUpload({ label, file, onChange }: { label: string; file: File | null; onChange: (f: File) => void }) {
    return (
        <Field label={label} required>
            <label className="block border-2 border-dashed border-border rounded p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])} />
                {file ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium"><Upload size={15} />{file.name}</div>
                ) : (
                    <><Upload size={20} className="mx-auto text-muted-foreground mb-1.5" />
                        <div className="text-sm text-muted-foreground">클릭하여 업로드</div>
                        <div className="text-xs text-muted-foreground mt-0.5">JPG, PNG, PDF · 최대 10MB</div></>
                )}
            </label>
        </Field>
    );
}

const inputCls = "w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors";

function Step1({ form, set, memberType }: { form: FormData; set: (f: Partial<FormData>) => void; memberType: MemberType }) {
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const pwMismatch = form.confirmPassword && form.password !== form.confirmPassword;

    return (
        <div className="space-y-4">
            {memberType === "employee" && (
                <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2">
                    <AlertCircle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700 leading-relaxed">직원으로 가입하시는 경우 <strong>대표자 위임장</strong>과 <strong>재직증명서</strong>를 함께 제출해야 합니다.</p>
                </div>
            )}
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground"><User size={14} className="text-primary" /> 계정 정보</div>
            <Field label="아이디 (이메일)" required hint="로그인 계정 및 세금계산서 수신 메일로 사용됩니다.">
                <input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="your@company.com" className={inputCls} />
            </Field>
            <Field label="비밀번호" required>
                <div className="relative">
                    <input type={showPw ? "text" : "password"} value={form.password} onChange={(e) => set({ password: e.target.value })} placeholder="8자 이상" className={`${inputCls} pr-10`} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
            </Field>
            <Field label="비밀번호 확인" required>
                <div className="relative">
                    <input type={showConfirm ? "text" : "password"} value={form.confirmPassword} onChange={(e) => set({ confirmPassword: e.target.value })} placeholder="비밀번호 재입력" className={`${inputCls} pr-10 ${pwMismatch ? "border-red-400" : ""}`} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
                {pwMismatch && <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>}
            </Field>
            <hr className="border-border" />
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground"><User size={14} className="text-primary" /> 담당자 정보</div>
            <Field label="담당자 이름" required>
                <input type="text" value={form.managerName} onChange={(e) => set({ managerName: e.target.value })} placeholder="홍길동" className={inputCls} />
            </Field>
            <Field label="담당자 연락처" required hint="주문·배송 관련 긴급 연락에 사용됩니다.">
                <input type="tel" value={form.managerPhone} onChange={(e) => set({ managerPhone: e.target.value })} placeholder="010-0000-0000" className={inputCls} />
            </Field>
                <PhoneAuthButton onAuthSuccess={(impUid: any) => {
                    // 1. 서버에서 impUid로 인증된 번호를 조회해서 가져오는 로직 필요
                    // 2. 여기서는 임시로 인증 성공 알림만 처리
                    alert("인증 성공!");
                }} />
            {memberType === "employee" && (
                <><hr className="border-border" />
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground"><Upload size={14} className="text-primary" /> 직원 증빙 서류</div>
                    <FileUpload label="대표자 위임장" file={form.delegationDoc} onChange={(f) => set({ delegationDoc: f })} />
                    <FileUpload label="재직증명서" file={form.employmentDoc} onChange={(f) => set({ employmentDoc: f })} /></>
            )}
        </div>
    );
}

function Step2({ form, set }: { form: FormData; set: (f: Partial<FormData>) => void }) {
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);
    const handleLookup = () => {
        if (!form.businessNo) return;
        setLoading(true);
        setTimeout(() => { set({ companyName: "(주)패션코리아", ceoName: "홍길동" }); setLoading(false); setFetched(true); }, 800);
    };
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground"><Building2 size={14} className="text-primary" /> 사업자 정보</div>
            <Field label="사업자등록번호" required>
                <div className="flex gap-2">
                    <input type="text" value={form.businessNo} onChange={(e) => set({ businessNo: e.target.value })} placeholder="000-00-00000" maxLength={12} className={inputCls} />
                    <button type="button" onClick={handleLookup} disabled={loading || !form.businessNo} className="shrink-0 px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-semibold rounded transition-colors whitespace-nowrap">
                        {loading ? "조회 중..." : "정보 조회"}
                    </button>
                </div>
                {fetched && <p className="text-xs text-emerald-600 mt-1">✓ 사업자 정보를 불러왔습니다.</p>}
            </Field>
            <Field label="상호명" required>
                <input type="text" value={form.companyName} onChange={(e) => set({ companyName: e.target.value })} placeholder="조회 후 자동 입력" className={inputCls} />
            </Field>
            <Field label="대표자명" required>
                <input type="text" value={form.ceoName} onChange={(e) => set({ ceoName: e.target.value })} placeholder="조회 후 자동 입력" className={inputCls} />
            </Field>
            <FileUpload label="사업자등록증 이미지" file={form.businessLicense} onChange={(f) => set({ businessLicense: f })} />
            <p className="text-xs text-muted-foreground -mt-2">플랫폼 승인 및 검증을 위해 최초 1회 제출합니다.</p>
        </div>
    );
}

function Step3({ form, set }: { form: FormData; set: (f: Partial<FormData>) => void }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground"><MapPin size={14} className="text-primary" /> 기본 배송지</div>
            <p className="text-xs text-muted-foreground bg-muted/40 rounded p-3 -mt-1">사업장 주소와 다를 수 있으므로 실제 상품을 수령할 주소를 입력해 주세요.</p>
            <Field label="주소" required>
                <input type="text" value={form.addressMain} onChange={(e) => set({ addressMain: e.target.value })} placeholder="시/도 및 도로명 주소" className={`${inputCls} mb-2`} />
                <input type="text" value={form.addressDetail} onChange={(e) => set({ addressDetail: e.target.value })} placeholder="상세 주소 (동/호수 등)" className={inputCls} />
            </Field>
            {/* 입력 현황 요약 */}
            <div className="bg-muted/40 border border-border rounded p-4 space-y-1.5">
                <p className="text-xs font-semibold text-foreground mb-2">지금까지 입력한 정보</p>
                {[
                    ["이메일",     form.email || "–"],
                    ["담당자",     form.managerName || "–"],
                    ["사업자번호", form.businessNo || "–"],
                    ["상호명",     form.companyName || "–"],
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

export function RegisterBuyer() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const memberType = (searchParams.get("type") ?? "ceo") as MemberType;
    const [step, setStep] = useState(1);
    const [form, setForm] = useState<FormData>({
        email: "", password: "", confirmPassword: "",
        managerName: "", managerPhone: "",
        delegationDoc: null, employmentDoc: null,
        businessNo: "", companyName: "", ceoName: "", businessLicense: null,
        addressMain: "", addressDetail: "",
        preferredCategories: [],
        agreed: false,
    });
    const set = (partial: Partial<FormData>) => setForm((f) => ({ ...f, ...partial }));

    return (
        <div>
            <div className="flex items-center gap-3 mb-1">
                <button type="button" onClick={() => step === 1 ? navigate("/auth/register") : setStep((s) => s - 1)} className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={18} /></button>
                <div>
                    <h2 className="text-xl font-bold text-foreground leading-tight">바이어 회원가입</h2>
                    <p className="text-sm text-muted-foreground">{memberType === "employee" ? "직원" : "대표자"} · 가입 후 담당자 확인을 거쳐 계정이 활성화됩니다.</p>
                </div>
            </div>
            <div className="mb-4 mt-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${memberType === "ceo" ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-700"}`}>
          {memberType === "ceo" ? "대표자 가입" : "직원 가입"}
        </span>
            </div>
            <StepIndicator current={step} />
            {step === 1 && <Step1 form={form} set={set} memberType={memberType} />}
            {step === 2 && <Step2 form={form} set={set} />}
            {step === 3 && <Step3 form={form} set={set} />}
            {step === 4 && (
                <CategoryStep
                    selected={form.preferredCategories}
                    onChange={(ids) => set({ preferredCategories: ids })}
                    agreed={form.agreed}
                    onAgreedChange={(v) => set({ agreed: v })}
                    role="buyer"
                />
            )}
            <button
                type="button"
                onClick={() => { if (step < 4) setStep((s) => s + 1); else navigate("/auth/register/success"); }}
                disabled={step === 4 && !form.agreed}
                className="w-full mt-6 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-3 rounded font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
                {step < 4 ? "다음 단계" : "가입 신청하기"} <ArrowRight size={16} />
            </button>
        </div>
    );
}