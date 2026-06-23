import {type ReactNode, useState} from "react";
import {Link, useNavigate} from "react-router";
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Building2,
    CreditCard,
    Eye,
    EyeOff,
    Globe,
    Store,
    Tag,
    Upload,
    User,
} from "lucide-react";
import {AgreementCheckbox, CategoryPicker, isValidCategoryCount} from "./Category";
import {signUpSeller, uploadFile} from "@/api/auth";

// ── FormData — SellerSignUpRequest 1:1 매핑 ───────────────────────────────────

type StoreType = "offline" | "online" | "both";

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
    businessLicenseFile: File | null;
    // 매장 정보
    websiteUrl: string;
    storeType: StoreType;
    brandName: string;
    // 정산 계좌
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    // 카테고리 (2종)
    preferredCategoryIds: number[];   // 개인 선호
    handledCategoryIds: number[];     // 회사 취급
    agreed: boolean;
}

const STEPS = [
    {num: 1, label: "계정 정보", icon: <User size={14}/>},
    {num: 2, label: "사업자 정보", icon: <Building2 size={14}/>},
    {num: 3, label: "매장 정보", icon: <Store size={14}/>},
    {num: 4, label: "정산 계좌", icon: <CreditCard size={14}/>},
    {num: 5, label: "카테고리", icon: <Tag size={14}/>},
];

const BANKS = ["국민", "신한", "우리", "하나", "농협", "기업", "카카오뱅크", "토스뱅크", "케이뱅크", "SC제일", "씨티", "기타"];

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
            <Field label="아이디 (이메일)" required hint="로그인 계정 및 정산 알림 메일로 사용됩니다.">
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
            <Field label="연락처" required>
                <input type="tel" value={form.phone} onChange={(e) => set({phone: e.target.value})}
                       placeholder="010-0000-0000" className={inputCls}/>
            </Field>
        </div>
    );
}

// ── Step 2: 사업자 정보 ────────────────────────────────────────────────────────

function Step2({form, set}: { form: FormData; set: (f: Partial<FormData>) => void }) {
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);

    const handleLookup = () => {
        if (!form.businessNumber) return;
        setLoading(true);
        setTimeout(() => {
            set({
                companyName: "(주)동대문패션",
                representativeName: "홍길동",
                address: "서울특별시 중구 을지로",
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
                {fetched && <p className="text-xs text-emerald-600 mt-1">✓ 사업자 정보를 불러왔습니다. 내용을 확인해 주세요.</p>}
            </Field>
            <Field label="회사명 (법인명)" required>
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
            <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2">
                <AlertCircle size={14} className="text-amber-600 mt-0.5 shrink-0"/>
                <p className="text-xs text-amber-700 leading-relaxed">
                    일부 업태·업종은 셀러 가입이 제한됩니다.{" "}
                    <Link to="/restricted-businesses" className="text-amber-800 font-semibold underline">가입 불가 업태/업종
                        확인하기 →</Link>
                </p>
            </div>
        </div>
    );
}

// ── Step 3: 매장 정보 ──────────────────────────────────────────────────────────

function Step3({form, set}: { form: FormData; set: (f: Partial<FormData>) => void }) {
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
                <input type="text" value={form.brandName} onChange={(e) => set({brandName: e.target.value})}
                       placeholder="대표 브랜드 (선택)" className={inputCls}/>
            </Field>
            <Field label="매장 타입" required>
                <div className="grid grid-cols-3 gap-2">
                    {storeOpts.map((opt) => (
                        <button key={opt.value} type="button" onClick={() => set({storeType: opt.value})}
                                className={`flex flex-col items-center gap-2 border-2 rounded px-2 py-3 text-xs font-medium transition-all ${
                                    form.storeType === opt.value ? "border-primary bg-secondary text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                                }`}>
                            <span className="flex gap-0.5">{opt.icon}</span>{opt.label}
                        </button>
                    ))}
                </div>
            </Field>
            {(form.storeType === "online" || form.storeType === "both") && (
                <Field label="쇼핑몰 URL" required hint="네이버 스마트스토어, 쿠팡, 자체몰 URL 등">
                    <input type="url" value={form.websiteUrl} onChange={(e) => set({websiteUrl: e.target.value})}
                           placeholder="https://smartstore.naver.com/mystore" className={inputCls}/>
                </Field>
            )}
        </div>
    );
}

// ── Step 4: 정산 계좌 ──────────────────────────────────────────────────────────

function Step4({form, set}: { form: FormData; set: (f: Partial<FormData>) => void }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <CreditCard size={14} className="text-primary"/> 정산 계좌 정보
            </div>
            <p className="text-xs text-muted-foreground -mt-2">바이어 결제 대금 정산을 위한 계좌입니다. 가입 후에도 변경할 수 있습니다.</p>
            <Field label="은행명" required>
                <select value={form.bankName} onChange={(e) => set({bankName: e.target.value})} className={inputCls}>
                    <option value="">은행 선택</option>
                    {BANKS.map((b) => <option key={b} value={b}>{b}은행</option>)}
                </select>
            </Field>
            <Field label="계좌번호" required>
                <input type="text" value={form.accountNumber} onChange={(e) => set({accountNumber: e.target.value})}
                       placeholder="숫자만 입력" className={inputCls}/>
            </Field>
            <Field label="예금주명" required>
                <input type="text" value={form.accountHolder} onChange={(e) => set({accountHolder: e.target.value})}
                       placeholder="예금주 이름" className={inputCls}/>
            </Field>

            {/* 중간 요약 */}
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

// ── Step 5: 카테고리 (2종) ─────────────────────────────────────────────────────

function Step5({form, set}: { form: FormData; set: (f: Partial<FormData>) => void }) {
    return (
        <div className="space-y-6">
            <CategoryPicker
                selected={form.preferredCategoryIds}
                onChange={(ids) => set({preferredCategoryIds: ids})}
                title="개인 선호 카테고리"
                description="평소 관심 있는 카테고리를 선택하면 맞춤 소싱 요청을 우선 받아보실 수 있습니다."
                required
            />
            <hr className="border-border"/>
            <CategoryPicker
                selected={form.handledCategoryIds}
                onChange={(ids) => set({handledCategoryIds: ids})}
                title="회사 취급 카테고리"
                description="우리 회사가 실제로 공급하는 카테고리를 선택하면 맞춤 바이어에게 우선 매칭됩니다."
                required
            />
            <AgreementCheckbox agreed={form.agreed} onAgreedChange={(v) => set({agreed: v})}/>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export function RegisterSeller() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState<FormData>({
        email: "", password: "", confirmPassword: "",
        name: "", phone: "",
        businessNumber: "", companyName: "", representativeName: "",
        address: "", addressDetail: "", businessLicenseFile: null,
        websiteUrl: "", storeType: "online", brandName: "",
        bankName: "", accountNumber: "", accountHolder: "",
        preferredCategoryIds: [], handledCategoryIds: [],
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
            return !!(form.businessNumber && form.companyName && form.representativeName && form.address && form.businessLicenseFile
            );
        }
        if (step === 3) {
            return !!(form.storeType && (form.storeType === "offline" || form.websiteUrl));
        }
        if (step === 4) {
            return !!(form.bankName && form.accountNumber && form.accountHolder);
        }
        if (step === 5) {
            return (
                isValidCategoryCount(form.preferredCategoryIds.length, true) &&
                isValidCategoryCount(form.handledCategoryIds.length, true) &&
                form.agreed
            );
        }
        return false;
    };

    const handleSubmit = async () => {
        // 이중 안전 장치
        if (!form.businessLicenseFile) {
            alert("사업자등록증 파일을 올려주세요.");
            return;
        }

        try {
            setIsSubmitting(true); // 락 걸기

            // 1. 파일 업로드 API 호출 및 S3 URL 확보
            const licenseUrl = await uploadFile(form.businessLicenseFile);

            // 2. 사업자 등록번호 하이픈 제거 (숫자 10자리 정제)
            const cleanBusinessNumber = form.businessNumber.replace(/-/g, "");

            // 3. 카테고리 ID 배열들을 백엔드 DTO 규격(Integer 타입)에 맞게 숫자 배열로 변환

            // 4. 백엔드 DTO 스펙에 맞게 데이터 조립
            const signUpRequestData = {
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
                storeType: form.storeType.toUpperCase() as "OFFLINE" | "ONLINE" | "BOTH", // 백엔드 Enum 규격이 대문자일 경우를 대비해 안전하게 변환
                brandName: form.brandName,
                bankName: form.bankName,
                accountNumber: form.accountNumber,
                accountHolder: form.accountHolder,
                preferredCategoryIds: form.preferredCategoryIds, // number[]
                handledCategoryIds: form.handledCategoryIds,     // number[]
            };

            // 5. 셀러 회원가입 API 요청
            // 전역 인터셉터가 response.data.data를 까서 주기 때문에 완료 메시지가 리턴됩니다.
            await signUpSeller(signUpRequestData);
            alert("셀러 가입 신청이 완료되었습니다!");

            navigate("/auth/register/success");

        } catch (error: any) {
            console.error("셀러 회원가입 에러:", error);

            // 인터셉터가 이미 에러 메시지(ex: "이미 등록된 사업자등록번호입니다.")를
            // error.message에 넣어두었으므로 딱 이 한 줄이면 처리 끝!
            alert(error.message);
        } finally {
            setIsSubmitting(false); // 락 해제
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
                    <h2 className="text-xl font-bold text-foreground leading-tight">셀러 회원가입</h2>
                    <p className="text-sm text-muted-foreground">가입 후 담당자 확인을 거쳐 계정이 활성화됩니다.</p>
                </div>
            </div>
            <div className="mb-4 mt-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">대표자 가입</span>
            </div>

            <StepIndicator current={step}/>

            {step === 1 && <Step1 form={form} set={set}/>}
            {step === 2 && <Step2 form={form} set={set}/>}
            {step === 3 && <Step3 form={form} set={set}/>}
            {step === 4 && <Step4 form={form} set={set}/>}
            {step === 5 && <Step5 form={form} set={set}/>}

            <button
                type="button"
                onClick={() => step < 5 ? setStep((s) => s + 1) : handleSubmit()}
                disabled={!canProceed() || isSubmitting}
                className="w-full mt-6 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
                {step < 5 ? "다음 단계" : isSubmitting ? "가입 신청 중..." : "가입 신청하기"} <ArrowRight size={16}/>
            </button>
        </div>
    );
}
