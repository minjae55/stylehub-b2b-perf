import {useState, type ReactNode} from "react";
import {Link, useNavigate, useSearchParams} from "react-router";
import {ArrowLeft, ArrowRight, Upload, Store, Globe, AlertCircle, Building2, CreditCard, User, Tag} from "lucide-react";
import {CategoryStep} from "./Category";

type StoreType = "offline" | "online" | "both";
type MemberType = "president" | "employee";

interface FormData {
    businessNo: string;
    companyName: string;
    presidentName: string;
    addressMain: string;
    addressDetail: string;
    businessLicense: File | null;
    delegationDoc: File | null;
    employmentDoc: File | null;
    storeName: string;
    storeType: StoreType;
    shopUrl: string;
    managerName: string;
    managerPhone: string;
    managerEmail: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    preferredCategories: string[];
    agreed: boolean;
}

const STEPS = [
    {num: 1, label: "사업자 정보", icon: <Building2 size={14}/>},
    {num: 2, label: "매장 정보", icon: <Store size={14}/>},
    {num: 3, label: "담당자·정산", icon: <CreditCard size={14}/>},
    {num: 4, label: "카테고리", icon: <Tag size={14}/>},
];

const BANKS = ["국민", "신한", "우리", "하나", "농협", "기업", "카카오뱅크", "토스뱅크", "케이뱅크", "SC제일", "씨티", "기타"];

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
    label: string;
    required?: boolean;
    hint?: string;
    children: ReactNode
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
        <Field label={label} required>
            <label
                className="block border-2 border-dashed border-border rounded p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <input type="file" accept="image/*,.pdf" className="hidden"
                       onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])}/>
                {file ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium"><Upload
                        size={15}/>{file.name}</div>
                ) : (
                    <><Upload size={20} className="mx-auto text-muted-foreground mb-1.5"/>
                        <div className="text-sm text-muted-foreground">클릭하여 업로드</div>
                        <div className="text-xs text-muted-foreground mt-0.5">JPG, PNG, PDF · 최대 10MB</div>
                    </>
                )}
            </label>
        </Field>
    );
}

const inputCls = "w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors";

function Step1({form, set}: {
    form: FormData;
    set: (f: Partial<FormData>) => void;
}) {
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);
    const handleLookup = () => {
        if (!form.businessNo) return;
        setLoading(true);
        setTimeout(() => {
            set({companyName: "(주)동대문패션", presidentName: "홍길동", addressMain: "서울특별시 중구 을지로"});
            setLoading(false);
            setFetched(true);
        }, 800);
    };
    return (
        <div className="space-y-4">
            <Field label="사업자등록번호" required>
                <div className="flex gap-2">
                    <input type="text" value={form.businessNo} onChange={(e) => set({businessNo: e.target.value})}
                           placeholder="000-00-00000" maxLength={12} className={inputCls}/>
                    <button type="button" onClick={handleLookup} disabled={loading || !form.businessNo}
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
                <input type="text" value={form.presidentName} onChange={(e) => set({presidentName: e.target.value})}
                       placeholder="조회 후 자동 입력" className={inputCls}/>
            </Field>
                <Field label="사업장 주소" required>
                    <input type="text" value={form.addressMain} onChange={(e) => set({addressMain: e.target.value})}
                           placeholder="시/도 및 도로명 주소" className={`${inputCls} mb-2`}/>
                    <input type="text" value={form.addressDetail} onChange={(e) => set({addressDetail: e.target.value})}
                           placeholder="상세 주소 (동/호수 등)" className={inputCls}/>
                </Field>
                <FileUpload label="사업자등록증 이미지" file={form.businessLicense} onChange={(f) => set({businessLicense: f})}/>
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

function Step2({form, set}: { form: FormData; set: (f: Partial<FormData>) => void }) {
    const storeOpts: { value: StoreType; label: string; icon: ReactNode }[] = [
        {value: "offline", label: "오프라인", icon: <Store size={16}/>},
        {value: "online", label: "온라인", icon: <Globe size={16}/>},
        {value: "both", label: "온·오프라인", icon: <><Store size={13}/><Globe size={13}/></>},
    ];
    return (
        <div className="space-y-4">
            <Field label="매장명 (상호명)" required>
                <input type="text" value={form.storeName} onChange={(e) => set({storeName: e.target.value})}
                       placeholder="고객에게 보여지는 브랜드/매장명" className={inputCls}/>
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
                    <input type="url" value={form.shopUrl} onChange={(e) => set({shopUrl: e.target.value})}
                           placeholder="https://smartstore.naver.com/mystore" className={inputCls}/>
                </Field>
            )}
        </div>
    );
}

function Step3({form, set}: { form: FormData; set: (f: Partial<FormData>) => void }) {
    return (
        <div className="space-y-5">
            <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-3"><User size={14}
                                                                                                            className="text-primary"/> 담당자
                    정보
                </div>
                <div className="space-y-3">
                    <Field label="담당자 이름" required>
                        <input type="text" value={form.managerName} onChange={(e) => set({managerName: e.target.value})}
                               placeholder="홍길동" className={inputCls}/>
                    </Field>
                    <Field label="담당자 연락처" required>
                        <input type="tel" value={form.managerPhone}
                               onChange={(e) => set({managerPhone: e.target.value})} placeholder="010-0000-0000"
                               className={inputCls}/>
                    </Field>
                    <Field label="담당자 이메일" required>
                        <input type="email" value={form.managerEmail}
                               onChange={(e) => set({managerEmail: e.target.value})} placeholder="your@company.com"
                               className={inputCls}/>
                    </Field>
                </div>
            </div>
            <hr className="border-border"/>
            <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-3"><CreditCard
                    size={14} className="text-primary"/> 입금 계좌 정보
                </div>
                <div className="space-y-3">
                    <Field label="은행명" required>
                        <select value={form.bankName} onChange={(e) => set({bankName: e.target.value})}
                                className={inputCls}>
                            <option value="">은행 선택</option>
                            {BANKS.map((b) => <option key={b} value={b}>{b}은행</option>)}
                        </select>
                    </Field>
                    <Field label="계좌번호" required>
                        <input type="text" value={form.accountNumber}
                               onChange={(e) => set({accountNumber: e.target.value})} placeholder="숫자만 입력"
                               className={inputCls}/>
                    </Field>
                    <Field label="예금주명" required>
                        <input type="text" value={form.accountHolder}
                               onChange={(e) => set({accountHolder: e.target.value})} placeholder="예금주 이름"
                               className={inputCls}/>
                    </Field>
                </div>
            </div>
            {/* 중간 요약 */}
            <div className="bg-muted/40 border border-border rounded p-4 space-y-1.5">
                <p className="text-xs font-semibold text-foreground mb-2">지금까지 입력한 정보</p>
                {[
                    ["사업자번호", form.businessNo || "–"],
                    ["회사명", form.companyName || "–"],
                    ["매장명", form.storeName || "–"],
                    ["담당자", form.managerName || "–"],
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

export function RegisterSeller() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const memberType = (searchParams.get("type") ?? "president") as MemberType;
    const [step, setStep] = useState(1);
    const [form, setForm] = useState<FormData>({
        businessNo: "", companyName: "", presidentName: "",
        addressMain: "", addressDetail: "", businessLicense: null,
        delegationDoc: null, employmentDoc: null,
        storeName: "", storeType: "online", shopUrl: "",
        managerName: "", managerPhone: "", managerEmail: "",
        bankName: "", accountNumber: "", accountHolder: "",
        preferredCategories: [],
        agreed: false,
    });
    const set = (partial: Partial<FormData>) => setForm((f) => ({...f, ...partial}));

    return (
        <div>
            <div className="flex items-center gap-3 mb-1">
                <button type="button" onClick={() => step === 1 ? navigate("/auth/register") : setStep((s) => s - 1)}
                        className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={18}/>
                </button>
                <div>
                    <h2 className="text-xl font-bold text-foreground leading-tight">셀러 회원가입</h2>
                    <p className="text-sm text-muted-foreground">{memberType === "employee" ? "직원" : "대표자"} · 가입 후 담당자
                        확인을 거쳐 계정이 활성화됩니다.</p>
                </div>
            </div>
            <div className="mb-4 mt-2">
        <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${memberType === "president" ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-700"}`}>
          {memberType === "president" ? "대표자 가입" : "직원 가입"}
        </span>
            </div>
            <StepIndicator current={step}/>
            {step === 1 && <Step1 form={form} set={set}/>}
            {step === 2 && <Step2 form={form} set={set}/>}
            {step === 3 && <Step3 form={form} set={set}/>}
            {step === 4 && (
                <CategoryStep
                    selected={form.preferredCategories}
                    onChange={(ids) => set({preferredCategories: ids})}
                    agreed={form.agreed}
                    onAgreedChange={(v) => set({agreed: v})}
                    role="seller"
                />
            )}
            <button
                type="button"
                onClick={() => {
                    if (step < 4) setStep((s) => s + 1); else navigate("/auth/register/success");
                }}
                disabled={step === 4 && !form.agreed}
                className="w-full mt-6 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-3 rounded font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
                {step < 4 ? "다음 단계" : "가입 신청하기"} <ArrowRight size={16}/>
            </button>
        </div>
    );
}