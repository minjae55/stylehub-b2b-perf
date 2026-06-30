/**
 * shared.tsx
 * 회원가입 플로우 전체에서 공유하는 타입 · 상수 · UI 원자 컴포넌트
 *
 * AddressSearchModal(다음 우편번호 검색 모달)도 여기 포함
 * — Field/FileUpload 등과 마찬가지로 특정 스텝에 종속되지 않는
 *   범용 UI 조각이라 shared로 합침
 */

import {type ReactNode, useEffect, useRef} from "react";
import {Building2, CreditCard, Store, Tag, Upload, User, X} from "lucide-react";

// ── 도메인 타입 ───────────────────────────────────────────────────────────────

export type Role = "buyer" | "seller";
export type MemberType = "president" | "employee";
export type StoreType = "offline" | "online" | "both";

// ── 폼 전체 슈퍼셋 (역할/유형과 무관하게 하나의 상태로 관리) ─────────────────

export interface RegisterFormData {
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
    zipcode: string;
    address: string;
    addressDetail: string;
    representativePhone: string;
    businessLicenseFile: File | null;

    // 셀러 대표 전용
    websiteUrl: string;
    storeType: StoreType;
    brandName: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    handledCategoryIds: number[];

    // 직원 전용 (조회 결과 표시용 — 서버 전송 대상 아님)
    employeeCompanyName: string;
    employeeRepresentativeName: string;
}

export const INITIAL_FORM: RegisterFormData = {
    email: "", password: "", confirmPassword: "",
    name: "", phone: "",
    businessNumber: "",
    preferredCategoryIds: [],
    agreed: false,
    companyName: "", representativeName: "", openDate: "",
    zipcode: "", address: "", addressDetail: "", representativePhone: "", businessLicenseFile: null,
    websiteUrl: "", storeType: "online", brandName: "",
    bankName: "", accountNumber: "", accountHolder: "",
    handledCategoryIds: [],
    employeeCompanyName: "", employeeRepresentativeName: "",
};


// ─────────────────────────────────────────────────────────────────────────────
// 비밀번호 유효성 검증 로직 및 실시간 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────

export interface PasswordScore {
    score: 0 | 1 | 2 | 3;
    label: "위험" | "미흡" | "보통" | "안전";
    colorCls: string;
    barWidth: string;
}

/**
 * 비밀번호 안전도 점수 계산기
 * - 8자 미만: 무조건 위험 (0점)
 * - 8자 이상 + 영문/숫자/특수문자 조합 개수에 따라 점수 부여 (1~3점)
 */
export function checkPasswordStrength(password: string): PasswordScore {
    if (!password) {
        return {score: 0, label: "위험", colorCls: "bg-muted text-muted-foreground", barWidth: "w-0"};
    }

    // 최소 8자 기준 방어선
    if (password.length < 8) {
        return {score: 0, label: "위험", colorCls: "bg-red-500 text-red-500", barWidth: "w-1/4"};
    }

    let criteriaCount = 0;
    if (/[a-zA-Z]/.test(password)) criteriaCount++; // 영문 포함
    if (/[0-9]/.test(password)) criteriaCount++;    // 숫자 포함
    if (/[~`!@#$%^&*()_\-+={[}\]|\\:;"'<,>.?/]/.test(password)) criteriaCount++; // 특수문자 포함

    // 조합 결과에 따른 등급 매기기
    if (criteriaCount <= 1) {
        return {score: 1, label: "미흡", colorCls: "bg-orange-400 text-orange-500", barWidth: "w-2/4"};
    }
    if (criteriaCount === 2) {
        return {score: 2, label: "보통", colorCls: "bg-yellow-500 text-yellow-600", barWidth: "w-3/4"};
    }

    // 8자 이상 + 영문 + 숫자 + 특수문자 삼박자 다 갖춘 경우
    return {score: 3, label: "안전", colorCls: "bg-emerald-500 text-emerald-600", barWidth: "w-full"};
}

/**
 * 인풋 아래에 들어갈 실시간 비밀번호 보안 레벨 위젯
 */
export function PasswordStrengthBar({password}: { password: string }) {
    const {label, colorCls, barWidth} = checkPasswordStrength(password);

    if (!password) return null;

    return (
        <div className="mt-1.5 space-y-1">
            {/* 게이지 바 배경 */}
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${colorCls.split(" ")[0]} transition-all duration-300 ${barWidth}`}/>
            </div>

            {/* 텍스트 표기 */}
            <div className="flex items-center justify-right text-[11px]">
                <span className={`font-semibold ${colorCls.split(" ")[1]}`}>
                    {label}
                </span>
            </div>
        </div>
    );
}

// ── 스텝 정의 ─────────────────────────────────────────────────────────────────

export const SELLER_PRESIDENT_STEPS = [
    {num: 1, label: "계정 정보", icon: <User size={14}/>},
    {num: 2, label: "사업자 정보", icon: <Building2 size={14}/>},
    {num: 3, label: "매장 정보", icon: <Store size={14}/>},
    {num: 4, label: "정산 계좌", icon: <CreditCard size={14}/>},
    {num: 5, label: "카테고리", icon: <Tag size={14}/>},
];

export const BUYER_PRESIDENT_STEPS = [
    {num: 1, label: "계정 정보", icon: <User size={14}/>},
    {num: 2, label: "사업자 정보", icon: <Building2 size={14}/>},
    {num: 3, label: "카테고리", icon: <Tag size={14}/>},
];

export const EMPLOYEE_STEPS = [
    {num: 1, label: "계정·담당자", icon: <User size={14}/>},
    {num: 2, label: "소속 회사 확인", icon: <Building2 size={14}/>},
    {num: 3, label: "카테고리", icon: <Tag size={14}/>},
];

export const BANKS = [
    "국민", "신한", "우리", "하나", "농협", "기업",
    "카카오뱅크", "토스뱅크", "케이뱅크", "SC제일", "씨티", "기타",
];

// ── Tailwind 클래스 상수 ──────────────────────────────────────────────────────

export const inputCls =
    "w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors";

export const readonlyCls =
    "w-full border border-border rounded px-3 py-2.5 text-sm bg-muted/40 text-muted-foreground cursor-not-allowed";

// ── 원자 UI 컴포넌트 ──────────────────────────────────────────────────────────

/** 라벨 + 필수 표시 + 힌트를 감싸는 필드 래퍼 */
export function Field({
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

/** 드래그&클릭 파일 업로드 버튼 */
export function FileUpload({
                               label, file, onChange,
                           }: {
    label: string; file: File | null; onChange: (f: File) => void;
}) {
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
                        <Upload size={15}/> {file.name}
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

/** 스텝 진행 표시바 */
export function StepIndicator({
                                  current, steps,
                              }: {
    current: number; steps: typeof SELLER_PRESIDENT_STEPS;
}) {
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
                            }`}>
                            {current > step.num ? "✓" : step.num}
                        </div>
                        <span className={`text-[10px] whitespace-nowrap ${
                            current === step.num ? "text-primary font-semibold" : "text-muted-foreground"
                        }`}>
                            {step.label}
                        </span>
                    </div>
                    {idx < steps.length - 1 && (
                        <div className={`flex-1 h-px mx-2 mb-4 transition-colors ${
                            current > step.num ? "bg-primary/40" : "bg-border"
                        }`}/>
                    )}
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// AddressSearchModal — 다음(Daum) 우편번호 검색 모달
// ─────────────────────────────────────────────────────────────────────────────
//
// 무료 · API 키 불필요. CDN 스크립트를 한 번만 로드하고,
// 모달 안에 embed 모드로 검색창을 그려서 사용자가 주소를 선택하면
// onComplete 콜백으로 결과를 돌려준다.
//
// 사용법
//   const [open, setOpen] = useState(false);
//   <AddressSearchModal
//     open={open}
//     onClose={() => setOpen(false)}
//     onComplete={(addr) => set({ address: addr.roadAddress })}
//   />

// 다음 우편번호 서비스가 onComplete 콜백에 넘겨주는 데이터 형태 (필요한 필드만 추림)
export interface DaumAddressResult {
    zonecode: string;        // 우편번호
    roadAddress: string;     // 도로명 주소
    jibunAddress: string;    // 지번 주소
    bname: string;           // 법정동/리 이름
    buildingName: string;    // 건물명 (있는 경우)
    apartment: "Y" | "N";    // 공동주택 여부
}

// 전역에 한 번만 로드되는 다음 우편번호 스크립트
const DAUM_POSTCODE_SRC = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

let daumScriptLoadingPromise: Promise<void> | null = null;

/** 스크립트를 중복 로드하지 않도록 전역에서 한 번만 fetch */
function loadDaumPostcodeScript(): Promise<void> {
    if (typeof window !== "undefined" && (window as any).daum?.Postcode) {
        return Promise.resolve();
    }
    if (daumScriptLoadingPromise) return daumScriptLoadingPromise;

    daumScriptLoadingPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = DAUM_POSTCODE_SRC;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("주소 검색 스크립트를 불러오지 못했습니다."));
        document.head.appendChild(script);
    });

    return daumScriptLoadingPromise;
}

interface AddressSearchModalProps {
    open: boolean;
    onClose: () => void;
    onComplete: (result: DaumAddressResult) => void;
}

export function AddressSearchModal({open, onClose, onComplete}: AddressSearchModalProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        let cancelled = false;

        loadDaumPostcodeScript()
            .then(() => {
                if (cancelled || !containerRef.current) return;

                // 컨테이너 초기화 (재오픈 시 중복 렌더 방지)
                containerRef.current.innerHTML = "";

                new (window as any).daum.Postcode({
                    oncomplete: (data: DaumAddressResult) => {
                        onComplete(data);
                        onClose();
                    },
                    width: "100%",
                    height: "100%",
                }).embed(containerRef.current);
            })
            .catch(() => {
                // 스크립트 로드 실패 시 모달을 닫고 사용자에게 알림
                onClose();
            });

        return () => {
            cancelled = true;
        };
    }, [open, onClose, onComplete]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 헤더 */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">주소 검색</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X size={18}/>
                    </button>
                </div>

                {/* 다음 우편번호 검색 위젯이 렌더링되는 영역 */}
                <div ref={containerRef} style={{width: "100%", height: 420}}/>
            </div>
        </div>
    );
}

// ───────────────────────────────────────────
// 사업자등록번호 (123-45-67890)
// ───────────────────────────────────────────
export const formatBusinessNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, "").slice(0, 10);

    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 5) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    }

    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5)}`;
};

// ───────────────────────────────────────────
// 전화번호 (휴대폰 + 지역번호)
// 01012345678 → 010-1234-5678
// 0212345678  → 02-1234-5678
// 021234567   → 02-123-4567
// 0311234567  → 031-123-4567
// 03112345678 → 031-1234-5678
// ───────────────────────────────────────────
export const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);

    // 서울(02)
    if (numbers.startsWith("02")) {
        if (numbers.length <= 2) return numbers;
        if (numbers.length <= 5) {
            return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
        }
        if (numbers.length <= 9) {
            return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`;
        }
        return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    }

    // 휴대폰 (010, 011 등)
    if (/^01\d/.test(numbers)) {
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 7) {
            return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        }
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    }

    // 일반 지역번호 (031, 032, 051 ...)
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    }
    if (numbers.length <= 10) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    }

    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
};