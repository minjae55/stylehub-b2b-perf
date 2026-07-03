/**
 * Register.tsx
 * 회원가입 메인 오케스트레이터
 *
 * 역할 (role) × 유형 (memberType) 조합에 따라 스텝 수와 렌더링 컴포넌트 분기
 *
 *  seller + president → 5스텝: 계정 → 사업자(OCR/국세청) → 매장 → 정산계좌 → 카테고리(선호+취급)
 *  buyer  + president → 3스텝: 계정 → 사업자(OCR/국세청) → 카테고리(선호)
 *         + employee  → 3스텝: 계정 → 소속회사 DB조회    → 카테고리(선호, 선택)
 *
 * 라우트: /auth/register/:role/:memberType
 *   예) /auth/register/seller/president
 *       /auth/register/buyer/employee
 */

import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { isValidCategoryCount } from "./Category";
import { StepAccount } from "./StepAccount";
import { StepPresidentBusiness } from "./StepPresidentBusiness";
import { StepEmployeeBusiness } from "./StepEmployeeBusiness";
import { StepBankAccount, StepCategory, StepStore } from "./StepForms";
import {
    BUYER_PRESIDENT_STEPS,
    EMPLOYEE_STEPS,
    INITIAL_FORM,
    type MemberType,
    type RegisterFormData,
    type Role,
    SELLER_PRESIDENT_STEPS,
    StepIndicator,
} from "./shared";
import { signUpBuyer, signUpEmployee, signUpSeller, uploadFile } from "@/api/auth/auth.service";
import { toast } from "sonner";
import { ErrorResponse } from "@/api/types";

// ── fieldErrors 키 → 스텝 번호 매핑 ──────────────────────────────────────────
//
// 백엔드가 fieldErrors를 내려줄 때 어느 스텝 소속 필드인지 보고
// 해당 스텝으로 자동 이동시킴

const FIELD_TO_STEP: Record<string, number> = {
    // Step 1 — 계정 정보
    email:             1,
    password:          1,
    confirmPassword:   1,
    name:              1,
    phone:             1,

    // Step 2 — 사업자/소속회사
    businessNumber:       2,
    companyName:          2,
    representativeName:   2,
    openDate:             2,
    address:              2,
    addressDetail:        2,
    zipcode:              2,
    representativePhone:  2,
    businessLicenseUrl:   2,
    employeeCompanyName:  2,

    // Step 3 — 매장 정보 (셀러 대표)
    storeType:  3,
    websiteUrl: 3,
    brandName:  3,

    // Step 4 — 정산 계좌 (셀러 대표)
    bankName:      4,
    accountNumber: 4,
    accountHolder: 4,

    // 마지막 스텝 — 카테고리 (스텝 번호는 렌더 시점에 totalSteps로 대체)
    preferredCategoryIds: 99,
    handledCategoryIds:   99,
    agreed:               99,
};

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export function Register() {
    const navigate = useNavigate();
    const { role, memberType } = useParams<{ role: Role; memberType: MemberType }>();

    const resolvedRole: Role       = role       ?? "buyer";
    const resolvedMemberType: MemberType = memberType ?? "president";

    const isEmployee        = resolvedMemberType === "employee";
    const isSellerPresident = resolvedRole === "seller" && resolvedMemberType === "president";
    const isBuyerPresident  = resolvedRole === "buyer"  && resolvedMemberType === "president";

    const steps = isEmployee
        ? EMPLOYEE_STEPS
        : isBuyerPresident
            ? BUYER_PRESIDENT_STEPS
            : SELLER_PRESIDENT_STEPS;

    const totalSteps = steps.length;

    // ── 상태 ─────────────────────────────────────────────────────────────────

    const [step,         setStep]         = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form,         setFormState]    = useState<RegisterFormData>(INITIAL_FORM);

    // Step 1 — 이메일·휴대폰 인증
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);

    // Step 2-A — 국세청 사업자 인증 (대표자)
    const [isBusinessVerified, setIsBusinessVerified] = useState(false);

    // Step 2-B — 소속 회사 DB 조회 (직원)
    const [isCompanyVerified,  setIsCompanyVerified]  = useState(false);
    const [isCompanyNotFound,  setIsCompanyNotFound]  = useState(false);

    // 제출 에러 — 버튼 아래 인라인 표시용
    const [submitError,  setSubmitError]  = useState("");
    // fieldErrors — 각 Step 컴포넌트에 내려서 필드 아래 표기
    const [fieldErrors,  setFieldErrors]  = useState<Record<string, string>>({});

    // ── 폼 업데이트 헬퍼 ─────────────────────────────────────────────────────

    const set = (partial: Partial<RegisterFormData>) => {
        setFormState((f) => ({ ...f, ...partial }));
        // 사업자 관련 필드 변경 시 국세청 인증 초기화
        if (
            !isEmployee &&
            (partial.businessNumber || partial.companyName ||
                partial.representativeName || partial.openDate)
        ) {
            setIsBusinessVerified(false);
        }
        // 직원 플로우 — 사업자번호/소속회사명 변경 시 DB조회 인증 초기화
        if (
            isEmployee &&
            (partial.businessNumber || partial.employeeCompanyName)
        ) {
            setIsCompanyVerified(false);
            setIsCompanyNotFound(false);
        }
        // 입력하면 해당 필드 에러 즉시 제거
        const changedKeys = Object.keys(partial);
        if (changedKeys.some((k) => fieldErrors[k])) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                changedKeys.forEach((k) => delete next[k]);
                return next;
            });
        }
    };

    // ── 스텝별 다음 진행 가능 여부 ───────────────────────────────────────────

    const canProceed = (): boolean => {
        const isPasswordValid =
            form.password.length >= 8 &&
            /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(form.password);

        if (step === 1) {
            return !!(
                form.email && isPasswordValid &&
                form.password === form.confirmPassword &&
                form.name && form.phone &&
                isEmailVerified && isPhoneVerified
            );
        }

        if (step === 2) {
            if (isEmployee) {
                return !!(form.businessNumber && form.employeeCompanyName && isCompanyVerified);
            }
            return !!(
                form.businessNumber && form.companyName &&
                form.representativeName && form.openDate &&
                form.address && form.businessLicenseFile &&
                form.zipcode && form.representativePhone &&
                isBusinessVerified
            );
        }

        if (isSellerPresident && step === 3) {
            return !!(form.storeType && (form.storeType === "offline" || form.websiteUrl));
        }

        if (isSellerPresident && step === 4) {
            return !!(form.bankName && form.accountNumber && form.accountHolder);
        }

        if (step === totalSteps) {
            const isPreferredValid = isValidCategoryCount(form.preferredCategoryIds.length, false);
            if (isSellerPresident) {
                return isPreferredValid && isValidCategoryCount(form.handledCategoryIds.length, true) && form.agreed;
            }
            return isPreferredValid && form.agreed;
        }

        return false;
    };

    // ── 최종 제출 ─────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        setSubmitError("");
        setFieldErrors({});

        try {
            setIsSubmitting(true);
            const cleanBusinessNumber = form.businessNumber.replace(/-/g, "");
            const cleanPhone = form.phone.replace(/-/g, "");
            const cleanRepresentativePhone = form.representativePhone.replace(/-/g, "");

            if (isEmployee) {
                await signUpEmployee({
                    email:            form.email,
                    password:         form.password,
                    name:             form.name,
                    phone:            cleanPhone,
                    businessNumber:   cleanBusinessNumber,
                    businessRole:     resolvedRole.toUpperCase() as "BUYER" | "SELLER",
                    preferredCategoryIds:
                        form.preferredCategoryIds.length > 0 ? form.preferredCategoryIds : undefined,
                });
                toast.success("가입 신청 완료!", {
                    description: `${resolvedRole === "buyer" ? "바이어" : "셀러"} 직원 가입 신청이 접수되었습니다. 대표자 승인 후 로그인 가능합니다.`,
                });

            } else if (isBuyerPresident) {
                if (!form.businessLicenseFile) {
                    toast.error("가입 신청 실패", { description: "사업자등록증 파일을 올려주세요." });
                    return;
                }
                const licenseUrl = await uploadFile(form.businessLicenseFile);
                await signUpBuyer({
                    email:               form.email,
                    password:            form.password,
                    name:                form.name,
                    phone:               cleanPhone,
                    businessNumber:      cleanBusinessNumber,
                    companyName:         form.companyName,
                    zipCode:             form.zipcode,
                    representativeName:  form.representativeName,
                    representativePhone: cleanRepresentativePhone,
                    address:             form.address,
                    addressDetail:       form.addressDetail,
                    businessLicenseUrl:  licenseUrl,
                    preferredCategoryIds: form.preferredCategoryIds,
                });
                toast.success("가입 완료!", { description: "바이어 가입 신청이 정상적으로 접수되었습니다." });

            } else {
                if (!form.businessLicenseFile) {
                    toast.error("가입 신청 실패", { description: "사업자등록증 파일을 올려주세요." });
                    return;
                }
                const licenseUrl = await uploadFile(form.businessLicenseFile);
                await signUpSeller({
                    email:               form.email,
                    password:            form.password,
                    name:                form.name,
                    phone:               cleanPhone,
                    businessNumber:      cleanBusinessNumber,
                    companyName:         form.companyName,
                    zipCode:             form.zipcode,
                    representativePhone: cleanRepresentativePhone,
                    representativeName:  form.representativeName,
                    address:             form.address,
                    addressDetail:       form.addressDetail,
                    businessLicenseUrl:  licenseUrl,
                    websiteUrl:          form.websiteUrl,
                    storeType:           form.storeType.toUpperCase() as "OFFLINE" | "ONLINE" | "BOTH",
                    brandName:           form.brandName,
                    bankName:            form.bankName,
                    accountNumber:       form.accountNumber,
                    accountHolder:       form.accountHolder,
                    preferredCategoryIds: form.preferredCategoryIds,
                    handledCategoryIds:   form.handledCategoryIds,
                });
                toast.success("가입 완료!", { description: "셀러 가입 신청이 정상적으로 접수되었습니다." });
            }

            navigate("/auth/register/success");

        } catch (error: any) {
            console.error("회원가입 에러:", error);

            const errorData = error?.response?.data;

            // ── fieldErrors가 있으면 해당 스텝으로 자동 이동 ────────────────
            if (errorData?.data && Object.keys(errorData.data).length > 0) {
                setFieldErrors(errorData.data);

                // fieldErrors 키 중 가장 앞선(숫자 낮은) 스텝으로 이동
                const targetStep = Object.keys(errorData.data).reduce((minStep, key) => {
                    const mappedStep = FIELD_TO_STEP[key] === 99
                        ? totalSteps   // 카테고리는 마지막 스텝
                        : (FIELD_TO_STEP[key] ?? totalSteps);
                    return Math.min(minStep, mappedStep);
                }, totalSteps);

                setStep(targetStep);

                toast.error("입력 정보를 확인해 주세요.", {
                    description: "표시된 항목을 수정한 후 다시 시도해 주세요.",
                    duration: 4000,
                });
                return;
            }

            // ── 일반 에러 — 버튼 아래 인라인 + toast ─────────────────────────
            const msg =
                errorData?.message ||
                error.message ||
                "입력한 정보를 다시 한번 확인해 주세요.";

            setSubmitError(msg);
            toast.error("가입 신청 실패", { description: msg, duration: 5000 });

        } finally {
            setIsSubmitting(false);
        }
    };

    // ── 헤더 ─────────────────────────────────────────────────────────────────

    const roleLabel   = resolvedRole === "buyer" ? "바이어" : "셀러";
    const memberLabel = isEmployee ? "직원" : "대표자";
    const badgeColor  = isEmployee
        ? "bg-amber-100 text-amber-700"
        : "bg-primary/10 text-primary";

    // ── 렌더링 ───────────────────────────────────────────────────────────────

    return (
        <div>
            {/* 헤더 */}
            <div className="flex items-center gap-3 mb-1">
                <button
                    type="button"
                    onClick={() => step === 1 ? navigate("/auth/register") : setStep((s) => s - 1)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft size={18} />
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

            <StepIndicator current={step} steps={steps} />

            {/* ── 스텝 렌더링 ── */}

            {step === 1 && (
                <StepAccount
                    form={form}
                    set={set}
                    setIsEmailVerified={setIsEmailVerified}
                    setIsPhoneVerified={setIsPhoneVerified}
                    fieldErrors={fieldErrors}
                />
            )}

            {step === 2 && !isEmployee && (
                <StepPresidentBusiness
                    form={form}
                    set={set}
                    isBusinessVerified={isBusinessVerified}
                    setIsBusinessVerified={setIsBusinessVerified}
                    role={resolvedRole}
                    fieldErrors={fieldErrors}
                />
            )}

            {step === 2 && isEmployee && (
                <StepEmployeeBusiness
                    form={form}
                    set={set}
                    isCompanyVerified={isCompanyVerified}
                    setIsCompanyVerified={setIsCompanyVerified}
                    isCompanyNotFound={isCompanyNotFound}
                    setIsCompanyNotFound={setIsCompanyNotFound}
                    fieldErrors={fieldErrors}
                />
            )}

            {step === 3 && isSellerPresident && (
                <StepStore form={form} set={set} fieldErrors={fieldErrors} />
            )}

            {step === 4 && isSellerPresident && (
                <StepBankAccount form={form} set={set} fieldErrors={fieldErrors} />
            )}

            {step === totalSteps && (
                <StepCategory
                    form={form}
                    set={set}
                    role={resolvedRole}
                    memberType={resolvedMemberType}
                    fieldErrors={fieldErrors}
                />
            )}

            {/* 다음/제출 버튼 */}
            <button
                type="button"
                onClick={() => step < totalSteps ? setStep((s) => s + 1) : handleSubmit()}
                disabled={!canProceed() || isSubmitting}
                className="w-full mt-6 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
                {step < totalSteps
                    ? "다음 단계"
                    : isSubmitting
                        ? "가입 신청 중..."
                        : "가입 신청하기"}
                <ArrowRight size={16} />
            </button>

            {/* 일반 에러 — 버튼 바로 아래 인라인 표시 */}
            {submitError && (
                <div className="mt-3 flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded p-3">
                    <AlertCircle size={13} className="shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                </div>
            )}
        </div>
    );
}