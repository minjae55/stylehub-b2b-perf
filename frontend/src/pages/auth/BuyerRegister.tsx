import {type ReactNode, useState} from "react";
import {useNavigate} from "react-router";
import {ArrowLeft, ArrowRight, Building2, Eye, EyeOff, Tag, Upload, User,} from "lucide-react";
import {CategoryStep, isValidCategoryCount} from "./Category";
import {signUpBuyer, uploadFile} from "@/api/auth";

// ── FormData — BuyerSignUpRequest 1:1 매핑 ────────────────────────────────────

interface FormData {
    // 계정 정보
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    phone: string;
    // 사업자 정보
    businessNumber: string;
    companyName: string;
    representativeName: string;
    address: string;
    addressDetail: string;
    businessLicenseFile: File | null;   // 업로드 후 businessLicenseUrl로 변환되어 전송
    // 카테고리
    preferredCategoryIds: number[];
    agreed: boolean;
}

const STEPS = [
    {num: 1, label: "계정 정보", icon: <User size={14}/>},
    {num: 2, label: "사업자 정보", icon: <Building2 size={14}/>},
    {num: 3, label: "카테고리", icon: <Tag size={14}/>},
];

// ── Shared UI ─────────────────────────────────────────────────────────────────

function StepIndicator({current}: { current: number }) {
    return (
        <div className="flex items-center mb-6">
            {STEPS.map((step, idx) => (
                <div key={step.num} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                current === step.num ? "bg-primary text-white"
                                    : current > step.num ? "bg-primary/20 text-primary"
                                        : "bg-muted text-muted-foreground"
                            }`}>
                            {current > step.num ? "✓" : step.num}
                        </div>
                        <span
                            className={`text-[10px] whitespace-nowrap ${current === step.num ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                            {step.label}
                        </span>
                    </div>
                    {idx < STEPS.length - 1 && (
                        <div
                            className={`flex-1 h-px mx-2 mb-4 transition-colors ${current > step.num ? "bg-primary/40" : "bg-border"}`}/>
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
                {label}{required && <span className="text-primary ml-1 text-xs">(필수)</span>}
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
                <input type="file" accept="image/*,.pdf" className="hidden"
                       onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])}/>
                {file ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium"><Upload
                        size={15}/>{file.name}</div>
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

// ── Step 1: 계정 정보 ──────────────────────────────────────────────────────────

function Step1({form, set}: { form: FormData; set: (f: Partial<FormData>) => void }) {
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const pwMismatch = form.confirmPassword && form.password !== form.confirmPassword;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <User size={14} className="text-primary"/> 계정 정보
            </div>
            <Field label="아이디 (이메일)" required hint="로그인 계정 및 세금계산서 수신 메일로 사용됩니다.">
                <input type="email" value={form.email} onChange={(e) => set({email: e.target.value})}
                       placeholder="your@company.com" className={inputCls}/>
            </Field>
            <Field label="비밀번호" required hint="8자 이상">
                <div className="relative">
                    <input type={showPw ? "text" : "password"} value={form.password}
                           onChange={(e) => set({password: e.target.value})} placeholder="8자 이상"
                           className={`${inputCls} pr-10`}/>
                    <button type="button" onClick={() => setShowPw(!showPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                </div>
            </Field>
            <Field label="비밀번호 확인" required>
                <div className="relative">
                    <input type={showConfirm ? "text" : "password"} value={form.confirmPassword}
                           onChange={(e) => set({confirmPassword: e.target.value})} placeholder="비밀번호 재입력"
                           className={`${inputCls} pr-10 ${pwMismatch ? "border-red-400" : ""}`}/>
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showConfirm ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                </div>
                {pwMismatch && <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>}
            </Field>
            <hr className="border-border"/>
            <Field label="이름" required>
                <input type="text" value={form.name} onChange={(e) => set({name: e.target.value})}
                       placeholder="홍길동" className={inputCls}/>
            </Field>
            <Field label="연락처" required hint="주문·배송 관련 긴급 연락에 사용됩니다.">
                <input type="tel" value={form.phone} onChange={(e) => set({phone: e.target.value})}
                       placeholder="010-0000-0000" className={inputCls}/>
            </Field>
        </div>
    );
}

// ── Step 2: 사업자 정보 (+ 주소 통합) ──────────────────────────────────────────

function Step2({form, set}: { form: FormData; set: (f: Partial<FormData>) => void }) {
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);

    const handleLookup = () => {
        if (!form.businessNumber) return;
        setLoading(true);
        // TODO: 실제 사업자등록정보 조회 API 연동
        setTimeout(() => {
            set({
                companyName: "(주)패션코리아",
                representativeName: "홍길동",
                address: "서울특별시 중구 을지로 123",
            });
            setLoading(false);
            setFetched(true);
        }, 800);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Building2 size={14} className="text-primary"/> 사업자 정보
            </div>
            <Field label="사업자등록번호" required>
                <div className="flex gap-2">
                    <input type="text" value={form.businessNumber}
                           onChange={(e) => set({businessNumber: e.target.value})}
                           placeholder="000-00-00000" maxLength={12} className={inputCls}/>
                    <button type="button" onClick={handleLookup} disabled={loading || !form.businessNumber}
                            className="shrink-0 px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-semibold rounded transition-colors whitespace-nowrap">
                        {loading ? "조회 중..." : "정보 조회"}
                    </button>
                </div>
                {fetched && <p className="text-xs text-emerald-600 mt-1">✓ 사업자 정보를 불러왔습니다.</p>}
            </Field>
            <Field label="상호명" required>
                <input type="text" value={form.companyName} onChange={(e) => set({companyName: e.target.value})}
                       placeholder="조회 후 자동 입력" className={inputCls}/>
            </Field>
            <Field label="대표자명" required>
                <input type="text" value={form.representativeName}
                       onChange={(e) => set({representativeName: e.target.value})}
                       placeholder="조회 후 자동 입력" className={inputCls}/>
            </Field>
            <Field label="사업장 주소" required>
                <input type="text" value={form.address} onChange={(e) => set({address: e.target.value})}
                       placeholder="시/도 및 도로명 주소" className={`${inputCls} mb-2`}/>
                <input type="text" value={form.addressDetail} onChange={(e) => set({addressDetail: e.target.value})}
                       placeholder="상세 주소 (동/호수 등)" className={inputCls}/>
            </Field>
            <FileUpload label="사업자등록증 이미지" file={form.businessLicenseFile}
                        onChange={(f) => set({businessLicenseFile: f})}/>
            <p className="text-xs text-muted-foreground -mt-2">플랫폼 승인 및 검증을 위해 최초 1회 제출합니다.</p>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export function RegisterBuyer() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState<FormData>({
        email: "", password: "", confirmPassword: "",
        name: "", phone: "",
        businessNumber: "", companyName: "", representativeName: "",
        address: "", addressDetail: "", businessLicenseFile: null,
        preferredCategoryIds: [],
        agreed: false,
    });
    const set = (partial: Partial<FormData>) => setForm((f) => ({...f, ...partial}));

    const canProceed = (): boolean => {
        if (step === 1) {
            return !!(
                form.email && form.password.length >= 8 &&
                form.password === form.confirmPassword &&
                form.name && form.phone
            );
        }
        if (step === 2) {
            return !!(form.businessNumber && form.companyName && form.representativeName && form.address);
        }
        if (step === 3) {
            return isValidCategoryCount(form.preferredCategoryIds.length, true) && form.agreed;
        }
        return false;
    };

    const handleSubmit = async () => {
        if (!form.businessLicenseFile) {
            alert("사업자등록증 파일을 올려주세요.");
            return;
        }

        try {
            setIsSubmitting(true); // 로딩 시작 (연타 방지)

            // ❶ 따로 빼놓은 파일 업로드 함수를 호출해서 S3 URL을 먼저 따옵니다.
            const licenseUrl = await uploadFile(form.businessLicenseFile);

            // ❷ 백엔드 DTO(record) 스펙에 맞게 가입용 객체를 가공합니다.
            const signUpRequestData = {
                email: form.email,
                password: form.password,
                name: form.name,
                phone: form.phone,
                businessNumber: form.businessNumber,
                companyName: form.companyName,
                representativeName: form.representativeName,
                address: form.address,
                addressDetail: form.addressDetail,
                businessLicenseUrl: licenseUrl,         // 👈 ❶번에서 받아온 URL을 여기에 쏙!
                preferredCategoryIds: form.preferredCategoryIds, // [1, 10, 20...] 숫자 배열
            };

            // ❸ 따로 빼놓은 바이어 회원가입 함수를 호출하면서 가공한 데이터를 넘겨줍니다.
            const message = await signUpBuyer(signUpRequestData);

            alert(message); // "바이어 가입 신청이 완료되었습니다." (서버 메시지 알림)

            // ❹ 성공했으니 다음 페이지로 이동!
            navigate("/auth/register/success");

        } catch (error: any) {
            console.error(error);
            // 에러 발생 시 알림
            alert(error.response?.data?.message || error.message || "회원가입 처리 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false); // 로딩 끝
        }
    };

    return (
        <div>
            <div className="flex items-center gap-3 mb-1">
                <button type="button" onClick={() => step === 1 ? navigate("/auth/register") : setStep((s) => s - 1)}
                        className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft size={18}/>
                </button>
                <div>
                    <h2 className="text-xl font-bold text-foreground leading-tight">바이어 회원가입</h2>
                    <p className="text-sm text-muted-foreground">가입 후 담당자 확인을 거쳐 계정이 활성화됩니다.</p>
                </div>
            </div>
            <div className="mb-4 mt-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">대표자 가입</span>
            </div>

            <StepIndicator current={step}/>

            {step === 1 && <Step1 form={form} set={set}/>}
            {step === 2 && <Step2 form={form} set={set}/>}
            {step === 3 && (
                <CategoryStep
                    selected={form.preferredCategoryIds}
                    onChange={(ids) => set({preferredCategoryIds: ids})}
                    agreed={form.agreed}
                    onAgreedChange={(v) => set({agreed: v})}
                    role="buyer"
                    required
                />
            )}

            <button
                type="button"
                onClick={() => step < 3 ? setStep((s) => s + 1) : handleSubmit()}
                disabled={!canProceed() || isSubmitting}
                className="w-full mt-6 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
                {step < 3 ? "다음 단계" : "가입 신청하기"} <ArrowRight size={16}/>
            </button>
        </div>
    );
}
