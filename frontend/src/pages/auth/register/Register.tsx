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

import {useState} from "react";
import {useNavigate, useParams} from "react-router";
import {ArrowLeft, ArrowRight} from "lucide-react";
import {isValidCategoryCount} from "./Category";
import {StepAccount} from "./StepAccount";
import {StepPresidentBusiness} from "./StepPresidentBusiness";
import {StepEmployeeBusiness} from "./StepEmployeeBusiness";
import {StepBankAccount, StepCategory, StepStore} from "./StepForms";
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
import {signUpBuyer, signUpEmployee, signUpSeller, uploadFile,} from "@/api/auth/auth.service";
import {toast} from "sonner";
import {ErrorResponse} from "@/api/types";

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export function Register() {
    const navigate = useNavigate();
    const {role, memberType} = useParams<{ role: Role; memberType: MemberType }>();

    // 라우트 파라미터 fallback (직접 접근 방어)
    const resolvedRole: Role = role ?? "buyer";
    const resolvedMemberType: MemberType = memberType ?? "president";

    const isEmployee = resolvedMemberType === "employee";
    const isSellerPresident = resolvedRole === "seller" && resolvedMemberType === "president";
    const isBuyerPresident = resolvedRole === "buyer" && resolvedMemberType === "president";

    // 역할/유형에 따른 스텝 배열 결정
    const steps = isEmployee
        ? EMPLOYEE_STEPS
        : isBuyerPresident
            ? BUYER_PRESIDENT_STEPS
            : SELLER_PRESIDENT_STEPS;

    const totalSteps = steps.length;

    // ── 상태 ─────────────────────────────────────────────────────────────────

    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setFormState] = useState<RegisterFormData>(INITIAL_FORM);

    // Step 1 — 이메일 · 휴대폰 인증 완료 여부 (StepAccount 에서 올려줌)
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);

    // Step 2-A — 국세청 사업자 인증 (대표자)
    const [isBusinessVerified, setIsBusinessVerified] = useState(false);

    // Step 2-B — 소속 회사 DB 조회 (직원)
    const [isCompanyVerified, setIsCompanyVerified] = useState(false);
    const [isCompanyNotFound, setIsCompanyNotFound] = useState(false);

    // ── 폼 업데이트 헬퍼 ─────────────────────────────────────────────────────

    const set = (partial: Partial<RegisterFormData>) => {
        setFormState((f) => ({...f, ...partial}));

        // 대표자: 사업자 관련 필드 변경 시 국세청 인증 초기화
        if (
            !isEmployee &&
            (partial.businessNumber || partial.companyName ||
                partial.representativeName || partial.openDate)
        ) {
            setIsBusinessVerified(false);
        }
    };

    // ── 스텝별 다음 진행 가능 여부 ───────────────────────────────────────────

    const canProceed = (): boolean => {
        // Step 1: 계정 정보 — 이메일·휴대폰 인증 모두 완료 필수
        const isPasswordValid =
            form.password.length >= 8 &&
            /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(form.password);

        if (step === 1) {
            return !!(
                form.email &&
                isPasswordValid &&
                form.password === form.confirmPassword &&
                form.name &&
                form.phone &&
                isEmailVerified &&
                isPhoneVerified
            );
        }

        // Step 2: 사업자(대표자) / 소속회사(직원) 확인
        if (step === 2) {
            if (isEmployee) {
                // 직원: DB 회사 조회 완료 필수
                return !!(form.businessNumber && form.employeeCompanyName && isCompanyVerified);
            }
            // 대표자: OCR 업로드 + 국세청 인증 완료 필수
            return !!(
                form.businessNumber && form.companyName &&
                form.representativeName && form.openDate &&
                form.address && form.businessLicenseFile &&
                form.zipcode && form.representativePhone &&
                isBusinessVerified
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

        // 마지막 스텝: 카테고리 + 약관 동의
        if (step === totalSteps) {
            // 1. 공통 조건: 선호 카테고리는 모든 역할 공통으로 '선택 사항'
            const isPreferredValid = isValidCategoryCount(form.preferredCategoryIds.length, false);

            // 2. 역할별 회사 취급 카테고리 분기
            if (isSellerPresident) {
                // 셀러 대표만 회사 취급 카테고리가 무조건 최소 1개 이상 필수
                const isHandledValid = isValidCategoryCount(form.handledCategoryIds.length, true);
                return isPreferredValid && isHandledValid && form.agreed;
            }

            // 바이어 대표 및 직원은 선호 카테고리(선택)와 약관 동의만 확인합니다.
            return isPreferredValid && form.agreed;
        }
        return false;
    };

    // ── 최종 제출 ─────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            const cleanBizNum = form.businessNumber.replace(/-/g, "");

            if (isEmployee) {
                // ── 직원 가입 ──────────────────────────────────────────────
                await signUpEmployee({
                    email: form.email,
                    password: form.password,
                    name: form.name,
                    phone: form.phone,
                    businessNumber: cleanBizNum,
                    businessRole: resolvedRole.toUpperCase() as "BUYER" | "SELLER",
                    preferredCategoryIds:
                        form.preferredCategoryIds.length > 0
                            ? form.preferredCategoryIds
                            : undefined,
                });
                toast.success("가입 신청 완료!", {
                    description: `${resolvedRole === "buyer" ? "바이어" : "셀러"} 직원 가입 신청이 접수되었습니다. 대표자 승인 후 로그인 가능합니다.`,
                });

            } else if (isBuyerPresident) {
                // ── 바이어 대표 가입 ───────────────────────────────────────
                if (!form.businessLicenseFile) {
                    toast.error("가입 신청 실패", {description: "사업자등록증 파일을 올려주세요."});
                    return;
                }
                const licenseUrl = await uploadFile(form.businessLicenseFile);
                await signUpBuyer({
                    email: form.email,
                    password: form.password,
                    name: form.name,
                    phone: form.phone,
                    businessNumber: cleanBizNum,
                    companyName: form.companyName,
                    zipCode: form.zipcode,
                    representativeName: form.representativeName,
                    representativePhone: form.representativePhone,
                    address: form.address,
                    addressDetail: form.addressDetail,
                    businessLicenseUrl: licenseUrl,
                    preferredCategoryIds: form.preferredCategoryIds,
                });
                toast.success("가입 완료!", {description: "바이어 가입 신청이 정상적으로 접수되었습니다."});

            } else {
                // ── 셀러 대표 가입 ─────────────────────────────────────────
                if (!form.businessLicenseFile) {
                    toast.error("가입 신청 실패", {description: "사업자등록증 파일을 올려주세요."});
                    return;
                }
                const licenseUrl = await uploadFile(form.businessLicenseFile);
                await signUpSeller({
                    email: form.email,
                    password: form.password,
                    name: form.name,
                    phone: form.phone,
                    businessNumber: cleanBizNum,
                    companyName: form.companyName,
                    zipCode: form.zipcode,
                    representativePhone: form.representativePhone,
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

            // 1. 프로젝트 공통 ErrorResponse 규격 (error.response.data) 파싱
            const errorData: ErrorResponse | undefined = error?.response?.data;
            let finalErrorMessage = "입력한 정보를 다시 한번 확인해 주세요.";

            if (errorData) {
                // @Valid 유효성 검사 실패로 fieldErrors가 존재하는 경우 (오브젝트 형태)
                if (errorData.fieldErrors && Object.keys(errorData.fieldErrors).length > 0) {
                    // 예: { "preferredCategoryIds": "크기가 3에서 5 사이여야 합니다" }
                    // 첫 번째로 발견된 필드 에러 메시지를 가져와 보여줍니다.
                    const firstFieldErrorKey = Object.keys(errorData.fieldErrors)[0];
                    finalErrorMessage = errorData.fieldErrors[firstFieldErrorKey];
                }
                // 일반 비즈니스 에러인 경우 (예: "비밀번호가 올바르지 않습니다.", "이미 존재하는 이메일입니다.")
                else if (errorData.message) {
                    finalErrorMessage = errorData.message;
                }
            } else if (error.message) {
                // 네트워크 다운 등 아예 응답을 못 받은 경우 기본 Axios 에러 메시지 fallback
                finalErrorMessage = error.message;
            }

            toast.error("가입 신청 실패", {
                description: finalErrorMessage,
                duration: 5000 // 사용자가 인지하도록 5초간 띄워둡니다.
            });

        } finally {
            setIsSubmitting(false);
        }
    };

    // ── 헤더 ─────────────────────────────────────────────────────────────────

    const roleLabel = resolvedRole === "buyer" ? "바이어" : "셀러";
    const memberLabel = isEmployee ? "직원" : "대표자";
    const badgeColor = isEmployee
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

            {/* 스텝 진행바 */}
            <StepIndicator current={step} steps={steps}/>

            {/* ── 스텝 렌더링 ──────────────────────────────────────────────── */}

            {/* Step 1: 계정 정보 + 이메일/휴대폰 인증 (공통) */}
            {step === 1 && (
                <StepAccount
                    form={form}
                    set={set}
                    setIsEmailVerified={setIsEmailVerified}
                    setIsPhoneVerified={setIsPhoneVerified}
                />
            )}

            {/* Step 2-A: 사업자 정보 — 대표자 */}
            {step === 2 && !isEmployee && (
                <StepPresidentBusiness
                    form={form}
                    set={set}
                    isBusinessVerified={isBusinessVerified}
                    setIsBusinessVerified={setIsBusinessVerified}
                    role={resolvedRole}
                />
            )}

            {/* Step 2-B: 소속 회사 확인 — 직원 */}
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

            {/* Step 3: 매장 정보 — 셀러 대표 전용 */}
            {step === 3 && isSellerPresident && (
                <StepStore form={form} set={set}/>
            )}

            {/* Step 4: 정산 계좌 — 셀러 대표 전용 */}
            {step === 4 && isSellerPresident && (
                <StepBankAccount form={form} set={set}/>
            )}

            {/* 마지막 스텝: 카테고리 + 약관 동의 */}
            {step === totalSteps && (
                <StepCategory
                    form={form}
                    set={set}
                    role={resolvedRole}
                    memberType={resolvedMemberType}
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
                <ArrowRight size={16}/>
            </button>
        </div>
    );
}
